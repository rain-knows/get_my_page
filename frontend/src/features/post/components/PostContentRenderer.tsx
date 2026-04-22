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
 * 功能：安全读取节点 attrs 中的字符串字段。
 * 关键参数：attrs 为节点属性对象；key 为字段名。
 * 返回值/副作用：返回字符串值或空字符串，无副作用。
 */
function readAttrString(attrs: Record<string, unknown> | undefined, key: string): string {
  const value = attrs?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 功能：安全读取节点 attrs 中的对象字段。
 * 关键参数：attrs 为节点属性对象；key 为字段名。
 * 返回值/副作用：返回对象值或 null，无副作用。
 */
function readAttrObject(attrs: Record<string, unknown> | undefined, key: string): Record<string, unknown> | null {
  const value = attrs?.[key];
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * 功能：渲染 embed 失败后的普通链接卡片，作为统一降级展示。
 * 关键参数：provider 为来源标识；fallbackUrl 为降级链接；title 为展示标题。
 * 返回值/副作用：返回链接卡片节点，无副作用。
 */
function renderFallbackLinkCard(provider: string, fallbackUrl: string, title: string): ReactNode {
  const normalizedUrl = fallbackUrl || '#';
  const providerLabel = provider ? provider.toUpperCase() : 'LINK';

  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noreferrer"
      className="block border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 hover:border-(--gmp-accent)"
    >
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">
        {providerLabel} | LINK CARD
      </div>
      <p className="mb-2 font-heading text-base font-black text-white">{title || 'OPEN LINK'}</p>
      <p className="font-mono text-[11px] text-(--gmp-text-secondary) break-all">{normalizedUrl}</p>
    </a>
  );
}

/**
 * 功能：将视频链接解析为可嵌入 iframe 的地址，无法识别时返回空字符串。
 * 关键参数：attrs 为 embedVideo 节点属性。
 * 返回值/副作用：返回 iframe 地址或空字符串，无副作用。
 */
function resolveVideoEmbedUrl(attrs: Record<string, unknown> | undefined): string {
  const provider = readAttrString(attrs, 'provider').toLowerCase();
  const videoId = readAttrString(attrs, 'videoId');
  const sourceUrl = readAttrString(attrs, 'url') || readAttrString(attrs, 'fallbackUrl');

  if (provider === 'youtube' && videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (provider === 'bilibili' && videoId.startsWith('BV')) {
    return `https://player.bilibili.com/player.html?bvid=${videoId}&page=1`;
  }

  if (provider === 'bilibili' && videoId.startsWith('av')) {
    return `https://player.bilibili.com/player.html?aid=${videoId.replace('av', '')}&page=1`;
  }

  if (provider === 'bilibili' && sourceUrl.includes('bilibili.com/video/')) {
    const maybeBvid = sourceUrl.split('video/').pop() || '';
    if (maybeBvid.startsWith('BV')) {
      return `https://player.bilibili.com/player.html?bvid=${maybeBvid}&page=1`;
    }
  }

  return '';
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

    return <div className="gmp-notion-viewer space-y-1">{renderTiptapNodes(doc.content ?? [])}</div>;
  }

  return <div className="gmp-notion-viewer space-y-1">{renderMdxLikeBlocks(content)}</div>;
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
        <h3 key={`mdx-block-${index}`} className="font-heading text-xl font-black text-white tracking-tight md:text-2xl">
          {block.replace(/^###\s+/, '')}
        </h3>
      );
    }

    if (block.startsWith('## ')) {
      return (
        <h2 key={`mdx-block-${index}`} className="font-heading text-2xl font-black text-white tracking-tight md:text-3xl">
          {block.replace(/^##\s+/, '')}
        </h2>
      );
    }

    if (block.startsWith('# ')) {
      return (
        <h1 key={`mdx-block-${index}`} className="font-heading text-3xl font-black text-white tracking-tight md:text-4xl">
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
        <ul key={`mdx-block-${index}`} className="space-y-2 pl-6 text-base leading-8 text-(--gmp-text-secondary) list-disc">
          {lines.map((line, lineIndex) => (
            <li key={`mdx-li-${index}-${lineIndex}`}>{line.replace(/^-\s+/, '')}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`mdx-block-${index}`} className="text-base leading-8 text-(--gmp-text-secondary)">
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
            <h1 key={key} className="font-heading text-3xl font-black text-white tracking-tight md:text-4xl">
              {titleText}
            </h1>
          );
        }
        if (level === 2) {
          return (
            <h2 key={key} className="font-heading text-2xl font-black text-white tracking-tight md:text-3xl">
              {titleText}
            </h2>
          );
        }
        return (
          <h3 key={key} className="font-heading text-xl font-black text-white tracking-tight md:text-2xl">
            {titleText}
          </h3>
        );
      }
      case 'paragraph':
        return (
          <p key={key} className="text-base leading-8 text-(--gmp-text-secondary)">
            {renderInlineContent(node.content ?? [])}
          </p>
        );
      case 'bulletList':
        return (
          <ul key={key} className="space-y-2 pl-6 text-base leading-8 text-(--gmp-text-secondary) list-disc">
            {renderTiptapNodes(node.content ?? [])}
          </ul>
        );
      case 'orderedList':
        return (
          <ol key={key} className="space-y-2 pl-6 text-base leading-8 text-(--gmp-text-secondary) list-decimal">
            {renderTiptapNodes(node.content ?? [])}
          </ol>
        );
      case 'listItem':
        return <li key={key}>{renderTiptapNodes(node.content ?? [])}</li>;
      case 'blockquote':
        return (
          <blockquote key={key} className="border-l-2 border-(--gmp-accent) bg-(--gmp-bg-panel) px-4 py-3 text-base leading-8 text-(--gmp-text-primary)">
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
      case 'divider':
        return <hr key={key} className="border-(--gmp-line-strong)" />;
      case 'image': {
        const src = readAttrString(node.attrs, 'src');
        const alt = readAttrString(node.attrs, 'alt') || 'article-image';
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
      case 'imageBlock': {
        const src = readAttrString(node.attrs, 'src');
        const alt = readAttrString(node.attrs, 'alt') || 'article-image';
        const caption = readAttrString(node.attrs, 'caption');
        if (!src) {
          return null;
        }
        return (
          <figure key={key} className="space-y-2">
            <img src={src} alt={alt} className="w-full border border-(--gmp-line-soft) bg-(--gmp-bg-panel) object-cover" />
            {caption ? (
              <figcaption className="font-mono text-[11px] tracking-widest text-(--gmp-text-secondary)">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      case 'embedGithub': {
        const resolved = Boolean(node.attrs?.resolved);
        const fallbackUrl = readAttrString(node.attrs, 'fallbackUrl') || readAttrString(node.attrs, 'url');
        const snapshot = readAttrObject(node.attrs, 'snapshot');
        const repoName =
          readSnapshotString(snapshot, 'fullName')
          || readSnapshotString(snapshot, 'name')
          || readAttrString(node.attrs, 'repo');
        const coverUrl = readSnapshotString(snapshot, 'coverUrl') || readSnapshotString(snapshot, 'avatarUrl');

        if (!resolved) {
          return <div key={key}>{renderFallbackLinkCard('github', fallbackUrl, repoName || 'GITHUB RESOURCE')}</div>;
        }

        return (
          <div key={key} className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">GITHUB CARD</p>
            {coverUrl ? (
              <img src={coverUrl} alt={repoName || 'github-cover'} className="h-28 w-full border border-(--gmp-line-soft) object-cover" />
            ) : null}
            <p className="font-heading text-lg font-black text-white">{repoName || 'UNKNOWN REPOSITORY'}</p>
            {readSnapshotString(snapshot, 'description') ? (
              <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{readSnapshotString(snapshot, 'description')}</p>
            ) : null}
            <a href={fallbackUrl} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
              OPEN REPOSITORY
            </a>
          </div>
        );
      }
      case 'embedMusic': {
        const resolved = Boolean(node.attrs?.resolved);
        const fallbackUrl = readAttrString(node.attrs, 'fallbackUrl') || readAttrString(node.attrs, 'url');
        const snapshot = readAttrObject(node.attrs, 'snapshot');
        const provider = readAttrString(node.attrs, 'provider') || 'music';
        const trackTitle = readSnapshotString(snapshot, 'title') || readSnapshotString(snapshot, 'name') || 'MUSIC RESOURCE';
        const coverUrl = readSnapshotString(snapshot, 'coverUrl');

        if (!resolved) {
          return <div key={key}>{renderFallbackLinkCard(provider, fallbackUrl, trackTitle)}</div>;
        }

        return (
          <div key={key} className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">
              {provider.toUpperCase()} CARD
            </p>
            {coverUrl ? (
              <img src={coverUrl} alt={trackTitle} className="h-30 w-full border border-(--gmp-line-soft) object-cover" />
            ) : null}
            <p className="font-heading text-lg font-black text-white">{trackTitle}</p>
            <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">
              {readSnapshotString(snapshot, 'artist') || readSnapshotString(snapshot, 'description') || 'UNKNOWN ARTIST'}
            </p>
            <a href={fallbackUrl} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
              OPEN MUSIC LINK
            </a>
          </div>
        );
      }
      case 'embedLink': {
        const url = readAttrString(node.attrs, 'url');
        const title = readAttrString(node.attrs, 'title');
        const description = readAttrString(node.attrs, 'description');
        const domain = readAttrString(node.attrs, 'domain');
        const siteName = readAttrString(node.attrs, 'siteName');
        const coverUrl = readAttrString(node.attrs, 'coverUrl');

        return (
          <a
            key={key}
            href={url || '#'}
            target="_blank"
            rel="noreferrer"
            className="block border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 hover:border-(--gmp-accent)"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">
              LINK CARD {siteName || domain ? `· ${siteName || domain}` : ''}
            </p>
            {coverUrl ? (
              <img src={coverUrl} alt={title || 'link-cover'} className="mt-2 h-34 w-full border border-(--gmp-line-soft) object-cover" />
            ) : null}
            <p className="mt-2 font-heading text-lg font-black text-white">{title || url || 'EXTERNAL RESOURCE'}</p>
            <p className="mt-1 text-sm leading-relaxed text-(--gmp-text-secondary)">{description || url}</p>
          </a>
        );
      }
      case 'embedVideo': {
        const provider = readAttrString(node.attrs, 'provider') || 'video';
        const title = readAttrString(node.attrs, 'title') || 'VIDEO RESOURCE';
        const description = readAttrString(node.attrs, 'description');
        const fallbackUrl = readAttrString(node.attrs, 'url') || readAttrString(node.attrs, 'fallbackUrl');
        const coverUrl = readAttrString(node.attrs, 'coverUrl');
        const embedUrl = resolveVideoEmbedUrl(node.attrs);

        return (
          <div key={key} className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">
              {provider.toUpperCase()} VIDEO CARD
            </p>
            {embedUrl ? (
              <div className="overflow-hidden border border-(--gmp-line-soft) bg-black aspect-video">
                <iframe
                  src={embedUrl}
                  title={title}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : coverUrl ? (
              <img src={coverUrl} alt={title} className="h-40 w-full border border-(--gmp-line-soft) object-cover" />
            ) : null}
            <p className="font-heading text-lg font-black text-white">{title}</p>
            {description ? (
              <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{description}</p>
            ) : null}
            <a href={fallbackUrl || '#'} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
              OPEN VIDEO LINK
            </a>
          </div>
        );
      }
      default:
        return (
          <p key={key} className="text-base leading-8 text-(--gmp-text-secondary)">
            {node.text ?? extractNodeText(node.content ?? [])}
          </p>
        );
    }
  });
}

/**
 * 功能：从快照对象中安全读取字符串字段。
 * 关键参数：snapshot 为卡片快照对象；key 为字段名。
 * 返回值/副作用：返回字符串值，缺失返回空字符串。
 */
function readSnapshotString(snapshot: Record<string, unknown> | null, key: string): string {
  const value = snapshot?.[key];
  return typeof value === 'string' ? value : '';
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
