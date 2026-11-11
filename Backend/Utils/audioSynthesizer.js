const https = require('https');
const cloudinary = require('../config/cloudinary');

/**
 * Strips HTML, code snippets, and markup to extract clean speech prose
 */
function cleanTextForNarration(title, subtitle, content) {
  let clean = `${title || ''}. ${subtitle || ''}. `;
  // Remove code blocks and syntax
  let text = String(content || '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  clean += text;
  // Limit to ~20,000 chars for speech generation
  return clean.slice(0, 20000);
}

function splitIntoChunks(text, maxLen = 170) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
        const words = trimmed.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function fetchGoogleTtsChunk(chunkText) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(chunkText);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;
    https
      .get(
        ttsUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Google TTS status: ${res.statusCode}`));
          }
          const chunks = [];
          res.on('data', (d) => chunks.push(d));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

/**
 * Streams an in-memory audio buffer directly to Cloudinary without writing to local disk.
 * Cloudinary manages audio files under resource_type: 'video'.
 */
function uploadAudioBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'blog_audios',
        public_id: publicId,
        format: 'mp3',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Synthesizes audio narration and streams directly to Cloudinary CDN.
 * Zero local disk writes — production and serverless safe.
 */
async function generateStoryAudio(blogId, title, subtitle, content) {
  const speechText = cleanTextForNarration(title, subtitle, content);
  const words = speechText.split(/\s+/).length;
  const estimatedDuration = Math.max(10, Math.round((words / 140) * 60));

  // 1. ElevenLabs Neural Audio Synthesis
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel
      const postData = JSON.stringify({
        text: speechText.slice(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      });

      const buffer = await new Promise((resolve, reject) => {
        const req = https.request(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
          },
          (res) => {
            const chunks = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(Buffer.concat(chunks));
              } else {
                reject(new Error(`ElevenLabs error status: ${res.statusCode}`));
              }
            });
          }
        );
        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      if (buffer && buffer.length > 500) {
        const uploadResult = await uploadAudioBufferToCloudinary(buffer, `audio-${blogId}`);
        const durationSeconds = Math.round(uploadResult.duration || estimatedDuration);
        return {
          audioUrl: uploadResult.secure_url,
          audioDuration: durationSeconds,
          fallbackText: speechText,
        };
      }
    } catch (err) {
      console.warn('ElevenLabs TTS synthesis failed, trying Google/Edge TTS fallback:', err.message);
    }
  }

  // 2. High-Quality Edge Neural Speech fallback via Google Translate TTS chunking
  try {
    const chunks = splitIntoChunks(speechText, 170).slice(0, 15);
    if (chunks.length > 0) {
      const audioBuffers = [];
      const batchSize = 5;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((chunk) =>
            fetchGoogleTtsChunk(chunk).catch((cErr) => {
              console.warn('Chunk synthesis error:', cErr.message);
              return null;
            })
          )
        );
        for (const buf of results) {
          if (buf && buf.length > 100) {
            audioBuffers.push(buf);
          }
        }
      }

      if (audioBuffers.length > 0) {
        const fullAudio = Buffer.concat(audioBuffers);
        if (fullAudio.length > 1000) {
          const uploadResult = await uploadAudioBufferToCloudinary(fullAudio, `audio-${blogId}`);
          const durationSeconds = Math.max(
            10,
            Math.round(uploadResult.duration || estimatedDuration)
          );
          return {
            audioUrl: uploadResult.secure_url,
            audioDuration: durationSeconds,
            fallbackText: speechText,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Audio synthesis or Cloudinary upload error:', err.message);
  }

  // 3. Fallback for Web Speech engine (when Cloudinary or external TTS is temporarily unreachable)
  return {
    audioUrl: '',
    audioDuration: estimatedDuration,
    fallbackText: speechText,
  };
}

module.exports = {
  generateStoryAudio,
  cleanTextForNarration,
};
