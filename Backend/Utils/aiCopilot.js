const https = require('https');

const stripHtml = (html = '') => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const countSyllables = (word = '') => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1;
  if (w.length <= 3) return 1;
  const matches = w.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) {
    count--;
  }
  return Math.max(1, count);
};

const calculateReadability = (text = '') => {
  const clean = stripHtml(text);
  if (!clean) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      readingEase: 100,
      gradeLevel: 'Grade 1',
      readTimeMinutes: 1,
      difficultyLabel: 'Very Easy',
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  let totalSyllables = 0;
  words.forEach((w) => {
    totalSyllables += countSyllables(w);
  });

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / Math.max(1, wordCount);

  // Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const readingEaseRaw = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const readingEase = Math.round(Math.max(0, Math.min(100, readingEaseRaw)));

  // Flesch-Kincaid Grade Level: 0.39 * ASL + 11.8 * ASW - 15.59
  const gradeLevelRaw = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const gradeLevel = Math.max(1, Math.round(gradeLevelRaw));

  let difficultyLabel = 'Standard';
  if (readingEase >= 80) difficultyLabel = 'Very Easy';
  else if (readingEase >= 60) difficultyLabel = 'Accessible & Conversational';
  else if (readingEase >= 50) difficultyLabel = 'Fairly Complex';
  else difficultyLabel = 'Academic / Advanced';

  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    sentenceCount,
    readingEase,
    gradeLevel: `Grade ${gradeLevel}`,
    readTimeMinutes,
    difficultyLabel,
  };
};

const extractSuggestedTags = (text = '', existingTags = []) => {
  const clean = stripHtml(text).toLowerCase();
  const STOP_WORDS = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'because', 'been',
    'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'does',
    'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
    'have', 'having', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'into', 'its', 'itself', 'just', 'more', 'most', 'myself', 'nor', 'not', 'now',
    'off', 'once', 'only', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
    'own', 'same', 'she', 'should', 'some', 'such', 'than', 'that', 'the', 'their',
    'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'too', 'under', 'until', 'very', 'was', 'were', 'what', 'when', 'where',
    'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'will', 'also', 'like', 'make', 'just', 'first', 'into',
  ]);

  const words = clean.match(/[a-z]{4,}/g) || [];
  const freq = {};
  words.forEach((w) => {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const suggestions = sorted
    .filter((w) => !existingTags.map((t) => t.toLowerCase()).includes(w))
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  return suggestions;
};

const generateAlgorithmicHeadlines = (title = '', content = '', category = 'Technology') => {
  const clean = stripHtml(content);
  const words = clean.split(/\s+/).slice(0, 40).join(' ');
  const topic = title.trim() || category || 'Modern Development';

  return [
    `The Complete Guide to ${topic}: Best Practices & Key Insights`,
    `Why ${topic} Matters More Than Ever in 2026`,
    `How to Master ${topic}: A Practical, Step-by-Step Approach`,
    `Deep Dive: Everything You Need to Know About ${topic}`,
    `5 Strategic Lessons Learned from ${topic}`,
  ];
};

const generateAlgorithmicTldr = (content = '') => {
  const clean = stripHtml(content);
  const sentences = clean.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 25);

  const summary =
    sentences.length > 0
      ? sentences.slice(0, 2).join('. ') + '.'
      : 'A comprehensive editorial exploration covering core principles, real-world application, and actionable insights.';

  const takeaways = [];
  if (sentences.length >= 3) {
    takeaways.push(sentences[1] + '.');
    takeaways.push(sentences[2] + '.');
    takeaways.push(sentences[Math.min(sentences.length - 1, 4)] + '.');
  } else {
    takeaways.push('Synthesizes foundational concepts into clear, actionable guidelines.');
    takeaways.push('Highlights critical architectural decisions and workflow best practices.');
    takeaways.push('Provides future-proof recommendations for sustained growth and performance.');
  }

  return { summary, takeaways };
};

const callGeminiModel = (apiKey, modelName, payload) => {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const text =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              resolve(text);
            } catch (err) {
              reject(err);
            }
          } else {
            const err = new Error(`Gemini API error: ${res.statusCode} ${data}`);
            err.statusCode = res.statusCode;
            reject(err);
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
};

const callGeminiApi = async (apiKey, prompt) => {
  const payload = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    },
  });

  const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      return await callGeminiModel(apiKey, model, payload);
    } catch (err) {
      lastError = err;
      if (err.statusCode === 404) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('No available Gemini model found');
};

const generateAiCopilotInsights = async ({ action, title = '', subtitle = '', content = '', category = 'Technology', tags = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanContent = stripHtml(content);

  if (action === 'analyze-readability') {
    const metrics = calculateReadability(content);
    const suggestedTags = extractSuggestedTags(content, tags);
    return {
      ...metrics,
      suggestedTags,
    };
  }

  if (action === 'generate-headlines') {
    if (apiKey) {
      try {
        const prompt = `You are a world-class magazine editor for an elite publication like Medium or The Verge.
Given the draft below, generate exactly 5 compelling, viral, high-converting article headlines that accurately capture the topic.
Draft Title: "${title}"
Category: "${category}"
Excerpt: "${cleanContent.slice(0, 1500)}"

Return ONLY a valid JSON array of 5 headline strings, like ["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"]. Do not include markdown code block backticks.`;

        const raw = await callGeminiApi(apiKey, prompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { headlines: parsed.slice(0, 5) };
        }
      } catch (err) {
        console.warn('Gemini headline generation failed, falling back to algorithmic generator:', err.message);
      }
    }
    return { headlines: generateAlgorithmicHeadlines(title, content, category) };
  }

  if (action === 'generate-tldr') {
    if (apiKey) {
      try {
        const prompt = `You are an elite publication editor. Given this article draft, generate an Executive Summary (1-2 sentences) and 3 bullet-point Key Takeaways.
Draft Title: "${title}"
Content: "${cleanContent.slice(0, 2000)}"

Return ONLY valid JSON in this exact structure:
{
  "summary": "1-2 sentence executive summary",
  "takeaways": [
    "Takeaway 1",
    "Takeaway 2",
    "Takeaway 3"
  ]
}
Do not include markdown code blocks.`;

        const raw = await callGeminiApi(apiKey, prompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed?.summary && Array.isArray(parsed?.takeaways)) {
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini TL;DR generation failed, falling back to algorithmic generator:', err.message);
      }
    }
    return generateAlgorithmicTldr(content);
  }

  throw new Error(`Unsupported AI Copilot action: ${action}`);
};

module.exports = {
  stripHtml,
  calculateReadability,
  extractSuggestedTags,
  generateAiCopilotInsights,
};

