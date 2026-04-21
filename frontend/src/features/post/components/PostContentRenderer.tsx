import type { ReactNode } from 'react';
import type { PostContentFormat } from '@/features/post/types';

interface PostContentRendererProps {
  content: string;
  contentFormat: PostContentFormat;
}

interface TiptapMark {
  type?: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

/**
 * 功能：根据后端 contentFormat 渲染文章正文，兼容 mdx 与 tiptap-json。
 * 关键参数：content 为正文内容；contentFormat 为正文格式标识。
 * 返回值/副作用：返回正文渲染节点，无副作用。
 */
export function PostContentRenderer({ content, contentFormat }: PostContentRendererProps) {
  if (contentFormat === 'tiptap-json') {
    const doc = parseTiptapDocument(content);
    if (!doc) {
      return (
        <pre className="overflow-x-auto border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 font-mono text-xs leading-relaxed text-(--gmp-text-primary)">
          <code>{content}</code>
        </pre>
      );
    }

    return <div className="space-y-5">{renderTiptapNodes(doc.content ?? [])}</div>;
  }

  return <div className="space-y-5">{renderMdxLikeBlocks(content)}</div>;
}

/**
 * 功能：将 tiptap JSON 文本解析为节点树。
 * 关键参数：rawContent 为后端返回的正文字符串。
 * 返回值/副作用：返回可渲染节点对象，解析失败返回 null；无副作用。
 */
function parseTiptapDocument(rawContent: string): TiptapNode | null {
  try {
    const parsed = JSON.parse(rawContent) as TiptapNode;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 功能：按简化规则渲染 MDX/Markdown 内容块，保证基础可读性。
 * 关键参数：content 为 MDX/Markdown 文本。
 * 返回值/副作用：返回块级节点数组，无副作用。
 */
function renderMdxLikeBlocks(content: string): ReactNode[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={`mdx-block-${index}`} className="font-heading text-xl font-black text-white uppercase tracking-tight">
          {block.replace(/^###\s+/, '')}
        </h3>
      );
    }

    if (block.startsWith('## ')) {
      return (
        <h2 key={`mdx-block-${index}`} className="font-heading text-2xl font-black text-white uppercase tracking-tight">
          {block.replace(/^##\s+/, '')}
        </h2>
      );
    }

    if (block.startsWith('# ')) {
      return (
        <h1 key={`mdx-block-${index}`} className="font-heading text-3xl font-black text-white uppercase tracking-tight">
          {block.replace(/^#\s+/, '')}
        </h1>
      );
    }

    if (block.startsWith('```') && block.endsWith('```')) {
      const code = block.replace(/^```\w*\n?/, '').replace(/```$/, '');
      return (
        <pre key={`mdx-block-${index}`} className="overflow-x-auto border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 font-mono text-xs leading-relaxed text-(--gmp-text-primary)">
          <code>{code}</code>
        </pre>
      );
    }

    if (block.startsWith('- ')) {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '));
      return (
        <ul key={`mdx-block-${index}`} className="space-y-2 pl-6 text-sm leading-relaxed text-(--gmp-text-secondary) list-disc">
          {lines.map((line, lineIndex) => (
            <li key={`mdx-li-${index}-${lineIndex}`}>{line.replace(/^-\s+/, '')}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`mdx-block-${index}`} className="text-sm leading-relaxed text-(--gmp-text-secondary)">
        {block}
      </p>
    );
  });
}

/**
 * 功能：递归渲染 tiptap 节点数组。
 * 关键参数：nodes 为 tiptap 节点集合。
 * 返回值/副作用：返回 React 节点数组，无副作用。
 */
function renderTiptapNodes(nodes: TiptapNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `tiptap-node-${node.type ?? 'unknown'}-${index}`;

    switch (node.type) {
      case 'heading': {
        const level = Number(node.attrs?.level ?? 2);
        const titleText = renderInlineContent(node.content ?? []);
        if (level <= 1) {
          return (
            <h1 key={key} className="font-heading text-3xl font-black text-white uppercase tracking-tight">
              {titleText}
            </h1>
          );
        }
        if (level === 2) {
          return (
            <h2 key={key} className="font-heading text-2xl font-black text-white uppercase tracking-tight">
              {titleText}
            </h2>
          );
        }
        return (
          <h3 key={key} className="font-heading text-xl font-black text-white uppercase tracking-tight">
            {titleText}
          </h3>
        );
      }
      case 'paragraph':
        return (
          <p key={key} className="text-sm leading-relaxed text-(--gmp-text-secondary)">
            {renderInlineContent(node.content ?? [])}
          </p>
        );
      case 'bulletList':
        return (
          <ul key={key} className="space-y-2 pl-6 text-sm leading-relaxed text-(--gmp-text-secondary) list-disc">
            {renderTiptapNodes(node.content ?? [])}
          </ul>
        );
      case 'orderedList':
        return (
          <ol key={key} className="space-y-2 pl-6 text-sm leading-relaxed text-(--gmp-text-secondary) list-decimal">
            {renderTiptapNodes(node.content ?? [])}
          </ol>
        );
      case 'listItem':
        return <li key={key}>{renderTiptapNodes(node.content ?? [])}</li>;
      case 'blockquote':
        return (
          <blockquote key={key} className="border-l-2 border-(--gmp-accent) bg-(--gmp-bg-panel) px-4 py-3 text-sm leading-relaxed text-(--gmp-text-primary)">
            {renderTiptapNodes(node.content ?? [])}
          </blockquote>
        );
      case 'codeBlock':
        return (
          <pre key={key} className="overflow-x-auto border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 font-mono text-xs leading-relaxed text-(--gmp-text-primary)">
            <code>{extractNodeText(node.content ?? [])}</code>
          </pre>
        );
      case 'horizontalRule':
        return <hr key={key} className="border-(--gmp-line-soft)" />;
      case 'image': {
        const src = typeof node.attrs?.src === 'string' ? node.attrs.src : '';
        const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : 'article-image';
        if (!src) {
          return null;
        }
        return (
          <img
            key={key}
            src={src}
            alt={alt}
            className="w-full border border-(--gmp-line-soft) bg-(--gmp-bg-panel) object-cover"
          />
        );
      }
      default:
        return (
          <p key={key} className="text-sm leading-relaxed text-(--gmp-text-secondary)">
            {node.text ?? extractNodeText(node.content ?? [])}
          </p>
        );
    }
  });
}

/**
 * 功能：渲染 tiptap 行内节点与 mark 样式。
 * 关键参数：nodes 为行内节点集合。
 * 返回值/副作用：返回可直接嵌入文本流的 React 节点数组，无副作用。
 */
function renderInlineContent(nodes: TiptapNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'hardBreak') {
      return <br key={`inline-br-${index}`} />;
    }

    const text = node.text ?? extractNodeText(node.content ?? []);
    return applyMarks(text, node.marks ?? [], index);
  });
}

/**
 * 功能：按 tiptap marks 包裹文本节点，支持粗体/斜体/代码/链接。
 * 关键参数：text 为基础文本；marks 为 mark 列表；index 用于节点 key。
 * 返回值/副作用：返回行内 React 节点，无副作用。
 */
function applyMarks(text: string, marks: TiptapMark[], index: number): ReactNode {
  return marks.reduce<ReactNode>((node, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong key={`mark-bold-${index}`}>{node}</strong>;
      case 'italic':
        return <em key={`mark-italic-${index}`}>{node}</em>;
      case 'code':
        return (
          <code key={`mark-code-${index}`} className="rounded-none border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-1 font-mono text-xs text-(--gmp-text-primary)">
            {node}
          </code>
        );
      case 'link': {
        const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#';
        return (
          <a key={`mark-link-${index}`} href={href} className="underline decoration-(--gmp-accent) underline-offset-2 text-white" target="_blank" rel="noreferrer">
            {node}
          </a>
        );
      }
      default:
        return node;
    }
  }, <span key={`mark-text-${index}`}>{text}</span>);
}

/**
 * 功能：提取节点树中的纯文本内容，供 fallback 与代码块渲染使用。
 * 关键参数：nodes 为节点集合。
 * 返回值/副作用：返回拼接后的文本字符串，无副作用。
 */
function extractNodeText(nodes: TiptapNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node.text === 'string') {
        return node.text;
      }
      if (Array.isArray(node.content)) {
        return extractNodeText(node.content);
      }
      return '';
    })
    .join('');
}
