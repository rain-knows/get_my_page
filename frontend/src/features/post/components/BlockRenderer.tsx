import type { ReactNode } from 'react';
import type {
  BlockDocument,
  BlockInlineMark,
  BlockInlineText,
  BlockNode,
  EmbedBlockNode,
} from '@/features/post/editor/block-model';

interface BlockRendererProps {
  document: BlockDocument;
}

/**
 * 功能：渲染 gmp-block-v1 文档为统一阅读视图，供编辑页预览与详情页共用。
 * 关键参数：document 为块文档对象。
 * 返回值/副作用：返回块渲染节点；无副作用。
 */
export function BlockRenderer({ document }: BlockRendererProps) {
  return (
    <div className="gmp-notion-viewer space-y-1">
      {document.blocks.map((block, index) => (
        <div key={`gmp-block-${index}`}>
          {renderBlockNode(block)}
        </div>
      ))}
    </div>
  );
}

/**
 * 功能：按块类型分发渲染组件，确保 paragraph/heading/list/embed 等块输出一致样式。
 * 关键参数：block 为单个块节点。
 * 返回值/副作用：返回块节点；无副作用。
 */
function renderBlockNode(block: BlockNode): ReactNode {
  if (block.type === 'paragraph') {
    return <p className="text-base leading-8 text-(--gmp-text-secondary)">{renderInlineTexts(normalizeInlineSegments((block as { richText?: unknown }).richText, (block as { text?: string }).text))}</p>;
  }

  if (block.type === 'heading') {
    const richText = normalizeInlineSegments((block as { richText?: unknown }).richText, (block as { text?: string }).text);
    if (block.level === 1) {
      return <h1 className="font-heading text-3xl font-black text-white tracking-tight md:text-4xl">{renderInlineTexts(richText)}</h1>;
    }
    if (block.level === 2) {
      return <h2 className="font-heading text-2xl font-black text-white tracking-tight md:text-3xl">{renderInlineTexts(richText)}</h2>;
    }
    return <h3 className="font-heading text-xl font-black text-white tracking-tight md:text-2xl">{renderInlineTexts(richText)}</h3>;
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-2 border-(--gmp-accent) bg-(--gmp-bg-panel) px-4 py-3 text-base leading-8 text-(--gmp-text-primary)">
        {renderInlineTexts(normalizeInlineSegments((block as { richText?: unknown }).richText, (block as { text?: string }).text))}
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const listItems = normalizeListItems((block as { items?: unknown }).items);
    const ListTag = block.style === 'ordered' ? 'ol' : 'ul';
    return (
      <ListTag className={`space-y-2 pl-6 text-base leading-8 text-(--gmp-text-secondary) ${block.style === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
        {listItems.map((item, index) => (
          <li key={`gmp-list-item-${index}`}>{renderInlineTexts(item)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === 'code') {
    return (
      <pre className="overflow-x-auto border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 font-mono text-xs leading-relaxed text-(--gmp-text-primary)">
        <code>{block.code || (block as { text?: string }).text || ''}</code>
      </pre>
    );
  }

  if (block.type === 'image') {
    return (
      <figure className="space-y-2">
        <img
          src={block.url}
          alt={block.alt || 'article-image'}
          className="w-full border border-(--gmp-line-soft) bg-(--gmp-bg-panel) object-cover"
        />
        {block.caption ? (
          <figcaption className="font-mono text-[11px] tracking-widest text-(--gmp-text-secondary)">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === 'embed') {
    return renderEmbedBlockNode(block);
  }

  return <hr className="border-(--gmp-line-strong)" />;
}

/**
 * 功能：渲染统一 embed 块，按 cardType 输出 GitHub/音乐/视频/链接卡片。
 * 关键参数：block 为 embed 块节点。
 * 返回值/副作用：返回卡片节点；无副作用。
 */
function renderEmbedBlockNode(block: EmbedBlockNode): ReactNode {
  if (block.cardType === 'github') {
    const repo = readSnapshotString(block.snapshot, 'fullName') || readSnapshotString(block.snapshot, 'name') || block.url;
    const description = readSnapshotString(block.snapshot, 'description');
    const coverUrl = readSnapshotString(block.snapshot, 'coverUrl') || readSnapshotString(block.snapshot, 'avatarUrl');

    return (
      <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">GITHUB CARD</p>
        {coverUrl ? <img src={coverUrl} alt={repo} className="h-28 w-full border border-(--gmp-line-soft) object-cover" /> : null}
        <p className="font-heading text-lg font-black text-white">{repo}</p>
        {description ? <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{description}</p> : null}
        <a href={block.url} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
          OPEN REPOSITORY
        </a>
      </div>
    );
  }

  if (block.cardType === 'music') {
    const title = readSnapshotString(block.snapshot, 'title') || readSnapshotString(block.snapshot, 'name') || 'MUSIC RESOURCE';
    const artist = readSnapshotString(block.snapshot, 'artist') || readSnapshotString(block.snapshot, 'description');
    const coverUrl = readSnapshotString(block.snapshot, 'coverUrl');
    const provider = block.provider || readSnapshotString(block.snapshot, 'provider') || 'music';

    return (
      <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">{provider.toUpperCase()} CARD</p>
        {coverUrl ? <img src={coverUrl} alt={title} className="h-30 w-full border border-(--gmp-line-soft) object-cover" /> : null}
        <p className="font-heading text-lg font-black text-white">{title}</p>
        {artist ? <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{artist}</p> : null}
        <a href={block.url} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
          OPEN MUSIC LINK
        </a>
      </div>
    );
  }

  if (block.cardType === 'video') {
    const title = readSnapshotString(block.snapshot, 'title') || 'VIDEO RESOURCE';
    const description = readSnapshotString(block.snapshot, 'description');
    const coverUrl = readSnapshotString(block.snapshot, 'coverUrl');
    const embedUrl = resolveVideoEmbedUrl(block);

    return (
      <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 space-y-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">{(block.provider || 'video').toUpperCase()} VIDEO CARD</p>
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
        {description ? <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{description}</p> : null}
        <a href={block.url} target="_blank" rel="noreferrer" className="inline-flex border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:border-white">
          OPEN VIDEO LINK
        </a>
      </div>
    );
  }

  const title = readSnapshotString(block.snapshot, 'title') || block.url;
  const description = readSnapshotString(block.snapshot, 'description') || block.url;
  const site = readSnapshotString(block.snapshot, 'siteName') || readSnapshotString(block.snapshot, 'domain');
  const coverUrl = readSnapshotString(block.snapshot, 'coverUrl');

  return (
    <a href={block.url} target="_blank" rel="noreferrer" className="block border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-4 hover:border-(--gmp-accent)">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">LINK CARD {site ? `· ${site}` : ''}</p>
      {coverUrl ? <img src={coverUrl} alt={title} className="mt-2 h-34 w-full border border-(--gmp-line-soft) object-cover" /> : null}
      <p className="mt-2 font-heading text-lg font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-(--gmp-text-secondary)">{description}</p>
    </a>
  );
}

/**
 * 功能：渲染块协议行内文本片段，并还原粗体/斜体/代码/链接样式。
 * 关键参数：segments 为行内文本片段数组。
 * 返回值/副作用：返回行内节点数组；无副作用。
 */
function renderInlineTexts(segments: BlockInlineText[]): ReactNode[] {
  return segments.map((segment, index) => {
    const baseNode = <span key={`gmp-inline-text-${index}`}>{segment.text}</span>;
    return applyInlineMarks(baseNode, segment.marks ?? [], index);
  });
}

/**
 * 功能：按顺序应用行内 marks 样式，保证链接/粗体/代码显示符合块协议定义。
 * 关键参数：node 为基础节点；marks 为样式标记数组；index 为 key 序号。
 * 返回值/副作用：返回包裹后的行内节点；无副作用。
 */
function applyInlineMarks(node: ReactNode, marks: BlockInlineMark[], index: number): ReactNode {
  return marks.reduce<ReactNode>((current, mark, markIndex) => {
    const key = `gmp-inline-mark-${index}-${markIndex}`;
    if (mark.type === 'bold') {
      return <strong key={key}>{current}</strong>;
    }
    if (mark.type === 'italic') {
      return <em key={key}>{current}</em>;
    }
    if (mark.type === 'code') {
      return (
        <code key={key} className="rounded-none border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-1 font-mono text-xs text-(--gmp-text-primary)">
          {current}
        </code>
      );
    }
    if (mark.type === 'link') {
      return (
        <a key={key} href={mark.href || '#'} className="underline decoration-(--gmp-accent) underline-offset-2 text-white" target="_blank" rel="noreferrer">
          {current}
        </a>
      );
    }
    return current;
  }, node);
}

/**
 * 功能：从 embed 快照中安全读取字符串字段。
 * 关键参数：snapshot 为快照对象；key 为字段名。
 * 返回值/副作用：返回字段值，缺失时返回空字符串。
 */
function readSnapshotString(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 功能：将任意输入归一化为块协议 richText 数组，兼容旧结构 text 字段回退。
 * 关键参数：value 为待归一化 richText；legacyText 为旧格式段落文本。
 * 返回值/副作用：返回可渲染 richText 数组；无副作用。
 */
function normalizeInlineSegments(value: unknown, legacyText = ''): BlockInlineText[] {
  if (Array.isArray(value) && value.length > 0) {
    const normalized: BlockInlineText[] = [];
    value.forEach((segment) => {
      if (!segment || typeof segment !== 'object') {
        return;
      }
      const text = typeof (segment as { text?: unknown }).text === 'string' ? (segment as { text: string }).text : '';
      const marks = Array.isArray((segment as { marks?: unknown }).marks) ? (segment as { marks: BlockInlineMark[] }).marks : undefined;
      normalized.push({
        text,
        ...(marks ? { marks } : {}),
      });
    });
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return [{ text: legacyText || '' }];
}

/**
 * 功能：将任意列表项数据归一化为 richText 二维数组，兼容旧结构 string 列表项。
 * 关键参数：value 为待归一化列表项数据。
 * 返回值/副作用：返回可渲染列表项二维数组；无副作用。
 */
function normalizeListItems(value: unknown): BlockInlineText[][] {
  if (!Array.isArray(value) || value.length === 0) {
    return [[{ text: '' }]];
  }
  const normalized = value.map((item) => {
    if (Array.isArray(item)) {
      return normalizeInlineSegments(item);
    }
    if (typeof item === 'string') {
      return [{ text: item }];
    }
    return [{ text: '' }];
  });
  return normalized.length > 0 ? normalized : [[{ text: '' }]];
}

/**
 * 功能：解析视频 embed 的可嵌入地址，支持 YouTube 与 Bilibili。
 * 关键参数：block 为视频 embed 块。
 * 返回值/副作用：返回 iframe 可用地址，无法识别时返回空字符串。
 */
function resolveVideoEmbedUrl(block: EmbedBlockNode): string {
  const provider = (block.provider || '').toLowerCase();
  const videoId = readSnapshotString(block.snapshot, 'videoId');

  if (provider === 'youtube' && videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (provider === 'bilibili' && videoId.startsWith('BV')) {
    return `https://player.bilibili.com/player.html?bvid=${videoId}&page=1`;
  }
  if (provider === 'bilibili' && videoId.startsWith('av')) {
    return `https://player.bilibili.com/player.html?aid=${videoId.replace('av', '')}&page=1`;
  }
  return '';
}
