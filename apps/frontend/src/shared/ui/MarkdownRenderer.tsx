import React from 'react';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  text: string;
}

interface MarkdownBlock {
  type: 'code' | 'list' | 'paragraph';
  content: string;
  items?: string[];
  language?: string;
}

function parseMarkdownToBlocks(text: string): MarkdownBlock[] {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: MarkdownBlock[] = [];
  let currentBlock: MarkdownBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code blocks
    if (line.trim().startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        // Close code block
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        // If there's an active block, push it first
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        // Start code block
        const lang = line.trim().slice(3).trim();
        currentBlock = {
          type: 'code',
          language: lang,
          content: '',
        };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === 'code') {
      currentBlock.content += (currentBlock.content ? '\n' : '') + line;
      continue;
    }

    // 2. List items
    const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)/);
    if (listMatch) {
      const itemContent = listMatch[3];
      if (currentBlock && currentBlock.type === 'list') {
        currentBlock.items!.push(itemContent);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          type: 'list',
          items: [itemContent],
          content: '',
        };
      }
      continue;
    }

    // 3. Empty lines (paragraph separator)
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // 4. Paragraph content
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.content += '\n' + line;
    } else {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: 'paragraph',
        content: line,
      };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex to split markdown tokens:
  // - Inline code: `code`
  // - Bold: **bold**
  // - Italic: *italic* or _italic_
  // - Link: [text](url)
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const linkText = match[1];
        const linkUrl = match[2];
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {linkText}
          </a>
        );
      }
    }
    return part;
  });
}

export default function MarkdownRenderer({ text }: MarkdownRendererProps) {
  const blocks = parseMarkdownToBlocks(text);

  return (
    <div className={styles.markdownBody}>
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          return (
            <div
              key={blockIdx}
              className={styles.codeBlockWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              {block.language && (
                <div className={styles.codeLanguage} aria-hidden="true">
                  {block.language}
                </div>
              )}
              <pre className={styles.codePre}>
                <code className={styles.codeText}>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={blockIdx} className={styles.unorderedList}>
              {block.items!.map((item, itemIdx) => (
                <li key={itemIdx} className={styles.listItem}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph
        return (
          <p key={blockIdx} className={styles.paragraph}>
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}
