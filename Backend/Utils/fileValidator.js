const fs = require('fs');

/**
 * Validates file binary magic bytes to guarantee file matches its extension
 * Zero external dependencies.
 *
 * Supported Signatures:
 * - PDF: %PDF (25 50 44 46)
 * - PNG: 89 50 4E 47
 * - JPEG: FF D8 FF
 * - ZIP / DOCX / ODT: PK.. (50 4B 03 04)
 * - DOC: D0 CF 11 E0
 * - RTF: {\rtf (7B 5C 72 74)
 */
function validateFileMagicBytes(filePath, ext) {
  if (!fs.existsSync(filePath)) return false;

  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    const normalizedExt = String(ext || '').toLowerCase();

    // PDF: %PDF
    if (normalizedExt === '.pdf') {
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }

    // DOCX, ODT (Open Packaging / ZIP format): PK\x03\x04
    if (normalizedExt === '.docx' || normalizedExt === '.odt') {
      return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    }

    // Legacy DOC (Compound File Binary Format): \xD0\xCF\x11\xE0
    if (normalizedExt === '.doc') {
      return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
    }

    // RTF: {\rt
    if (normalizedExt === '.rtf') {
      return buffer[0] === 0x7b && buffer[1] === 0x5c && buffer[2] === 0x72 && buffer[3] === 0x74;
    }

    // Plain Text: no null bytes in sample
    if (normalizedExt === '.txt') {
      return !buffer.some((byte) => byte === 0x00);
    }

    // Images
    if (normalizedExt === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    if (normalizedExt === '.jpg' || normalizedExt === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    return true;
  } catch (error) {
    if (fd) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
    console.error('Magic bytes validation error:', error.message);
    return false;
  }
}

module.exports = {
  validateFileMagicBytes,
};

