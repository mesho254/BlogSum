// Markdown Import & Export Utility for BlogSum Editorial Studio

export const exportStoryToMarkdown = (story = {}) => {
  const {
    title = 'Untitled Story',
    subtitle = '',
    content = '',
    category = 'Technology',
    tags = [],
    imageUrl = '',
  } = story;

  let md = `---
title: "${title.replace(/"/g, '\\"')}"
subtitle: "${subtitle.replace(/"/g, '\\"')}"
category: "${category}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
date: "${new Date().toISOString()}"
---

# ${title}

`;

  if (subtitle) {
    md += `> ${subtitle}\n\n`;
  }

  if (imageUrl) {
    md += `![Featured Image](${imageUrl})\n\n`;
  }

  // Convert HTML elements into Markdown equivalents
  let converted = content
    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    // Pre & Code blocks
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n')
    // Formatting
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Images & Links
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)\n\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)\n\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    // Paragraphs & Breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    // Remove leftover HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  md += converted.trim();

  // Create downloadable file
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const filename = `${(title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const parseMarkdownToStory = (markdownText = '') => {
  let text = markdownText;
  let parsedTitle = '';
  let parsedSubtitle = '';
  let parsedCategory = 'Technology';
  let parsedTags = [];

  // Parse YAML Frontmatter if present
  const frontmatterMatch = text.match(/^---\s*([\s\S]*?)\s*---/);
  if (frontmatterMatch) {
    const rawFm = frontmatterMatch[1];
    text = text.slice(frontmatterMatch[0].length).trim();

    const titleMatch = rawFm.match(/title:\s*["']?([^"'\n]+)["']?/i);
    if (titleMatch) parsedTitle = titleMatch[1].trim();

    const subtitleMatch = rawFm.match(/subtitle:\s*["']?([^"'\n]+)["']?/i);
    if (subtitleMatch) parsedSubtitle = subtitleMatch[1].trim();

    const catMatch = rawFm.match(/category:\s*["']?([^"'\n]+)["']?/i);
    if (catMatch) parsedCategory = catMatch[1].trim();

    const tagsMatch = rawFm.match(/tags:\s*\[(.*?)\]/i);
    if (tagsMatch) {
      parsedTags = tagsMatch[1]
        .split(',')
        .map((t) => t.replace(/["']/g, '').trim())
        .filter(Boolean);
    }
  }

  // If title was not in frontmatter, extract first # Heading
  if (!parsedTitle) {
    const h1Match = text.match(/^#\s+(.+)$/m);
    if (h1Match) {
      parsedTitle = h1Match[1].trim();
      text = text.replace(h1Match[0], '').trim();
    }
  }

  // Convert markdown body to HTML for Quill
  let html = text
    // Code fences
    .replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, '<pre class="ql-syntax"><code>$2</code></pre>')
    // Headings
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // Bold & Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Images & Links
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>')
    // Paragraphs
    .split(/\n\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return {
    title: parsedTitle,
    subtitle: parsedSubtitle,
    category: parsedCategory,
    tags: parsedTags,
    content: html,
  };
};

