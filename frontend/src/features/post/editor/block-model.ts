import type { JSONContent } from '@tiptap/core';

export type BlockCardType = 'github' | 'music' | 'video' | 'link';

export interface BlockInlineMark {
  type: 'bold' | 'italic' | 'code' | 'link';
  href?: string;
}

export interface BlockInlineText {
  text: string;
  marks?: BlockInlineMark[];
}

export interface ParagraphBlockNode {
  type: 'paragraph';
  richText: BlockInlineText[];
}

export interface HeadingBlockNode {
  type: 'heading';
  level: 1 | 2 | 3;
  richText: BlockInlineText[];
}

export interface ListBlockNode {
  type: 'list';
  style: 'bullet' | 'ordered';
  items: BlockInlineText[][];
}

export interface QuoteBlockNode {
  type: 'quote';
  richText: BlockInlineText[];
}

export interface CodeBlockNode {
  type: 'code';
  language: string;
  code: string;
}

export interface ImageBlockNode {
  type: 'image';
  url: string;
  alt: string;
  caption: string;
}

export interface EmbedBlockNode {
  type: 'embed';
  cardType: BlockCardType;
  provider: string;
  url: string;
  snapshot: Record<string, unknown>;
}

export interface DividerBlockNode {
  type: 'divider';
}

export type BlockNode =
  | ParagraphBlockNode
  | HeadingBlockNode
  | ListBlockNode
  | QuoteBlockNode
  | CodeBlockNode
  | ImageBlockNode
  | EmbedBlockNode
  | DividerBlockNode;

export interface BlockDocument {
  version: 'gmp-block-v1';
  meta?: {
    migrationVersion?: number;
    sourceFormat?: string;
    migratedAt?: string;
  };
  blocks: BlockNode[];
}

/**
 * 功能：创建空白 gmp-block-v1 文档，作为解析失败与初始化时的统一兜底。
 * 关键参数：无。
 * 返回值/副作用：返回空文档对象；无副作用。
 */
export function createEmptyBlockDocument(): BlockDocument {
  return {
    version: 'gmp-block-v1',
    blocks: [{ type: 'paragraph', richText: [{ text: '' }] }],
  };
}

/**
 * 功能：判断任意对象是否符合 gmp-block-v1 协议基础结构。
 * 关键参数：value 为待判定对象。
 * 返回值/副作用：返回布尔值；无副作用。
 */
export function isBlockDocument(value: unknown): value is BlockDocument {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { version?: unknown; blocks?: unknown };
  return candidate.version === 'gmp-block-v1' && Array.isArray(candidate.blocks);
}

/**
 * 功能：将字符串正文解析为 gmp-block-v1 文档对象。
 * 关键参数：rawContent 为后端返回正文字符串。
 * 返回值/副作用：返回块文档或 null；无副作用。
 */
export function parseBlockDocument(rawContent: string): BlockDocument | null {
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (!isBlockDocument(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 功能：将 tiptap JSON 文档转换为 gmp-block-v1 块文档，供保存与统一渲染使用。
 * 关键参数：doc 为 tiptap 文档 JSON。
 * 返回值/副作用：返回块文档对象；无副作用。
 */
export function convertTiptapDocToBlockDocument(doc: JSONContent): BlockDocument {
  const blocks: BlockNode[] = [];
  const content = Array.isArray(doc.content) ? doc.content : [];

  content.forEach((node) => {
    switch (node.type) {
      case 'paragraph':
        blocks.push({
          type: 'paragraph',
          richText: extractInlineTextArray(node.content),
        });
        return;
      case 'heading': {
        const level = normalizeHeadingLevel(node.attrs?.level);
        blocks.push({
          type: 'heading',
          level,
          richText: extractInlineTextArray(node.content),
        });
        return;
      }
      case 'bulletList':
      case 'orderedList':
        blocks.push({
          type: 'list',
          style: node.type === 'orderedList' ? 'ordered' : 'bullet',
          items: extractListItems(node.content),
        });
        return;
      case 'blockquote':
        blocks.push({
          type: 'quote',
          richText: extractInlineTextArrayFromAny(node.content),
        });
        return;
      case 'codeBlock':
        blocks.push({
          type: 'code',
          language: readAttrString(node.attrs, 'language'),
          code: extractTextPlain(node.content),
        });
        return;
      case 'horizontalRule':
      case 'divider':
        blocks.push({ type: 'divider' });
        return;
      case 'image':
      case 'imageBlock':
        blocks.push({
          type: 'image',
          url: readAttrString(node.attrs, 'src'),
          alt: readAttrString(node.attrs, 'alt') || 'article-image',
          caption: readAttrString(node.attrs, 'caption'),
        });
        return;
      case 'embedGithub':
        blocks.push(buildEmbedBlockNode('github', node.attrs));
        return;
      case 'embedMusic':
        blocks.push(buildEmbedBlockNode('music', node.attrs));
        return;
      case 'embedVideo':
        blocks.push(buildEmbedBlockNode('video', node.attrs));
        return;
      case 'embedLink':
        blocks.push(buildEmbedBlockNode('link', node.attrs));
        return;
      default: {
        const fallbackText = extractTextPlain(node.content);
        if (fallbackText) {
          blocks.push({
            type: 'paragraph',
            richText: [{ text: fallbackText }],
          });
        }
      }
    }
  });

  return {
    version: 'gmp-block-v1',
    blocks: blocks.length > 0 ? blocks : [{ type: 'paragraph', richText: [{ text: '' }] }],
  };
}

/**
 * 功能：将 gmp-block-v1 文档转换为 tiptap JSON 文档，供编辑器加载与二次编辑。
 * 关键参数：document 为块文档对象。
 * 返回值/副作用：返回 tiptap 文档 JSON；无副作用。
 */
export function convertBlockDocumentToTiptapDoc(document: BlockDocument): JSONContent {
  const content: JSONContent[] = document.blocks.map((block) => convertBlockNodeToTiptapNode(block));
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
  };
}

/**
 * 功能：从 gmp-block-v1 文档中提取纯文本摘要。
 * 关键参数：document 为块文档；maxLength 为最大摘要长度。
 * 返回值/副作用：返回摘要文本；无副作用。
 */
export function buildExcerptFromBlockDocument(document: BlockDocument, maxLength = 140): string {
  const plain = document.blocks
    .map((block) => {
      if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') {
        return inlineTextArrayToPlain(block.richText);
      }
      if (block.type === 'list') {
        return block.items.map((item) => inlineTextArrayToPlain(item)).join(' ');
      }
      if (block.type === 'code') {
        return block.code;
      }
      if (block.type === 'embed') {
        const snapshotTitle = readSnapshotString(block.snapshot, 'title');
        return snapshotTitle || block.url;
      }
      if (block.type === 'image') {
        return block.caption || block.alt;
      }
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength)}...`;
}

/**
 * 功能：将块节点转换为 tiptap 节点，保持编辑器可读写能力。
 * 关键参数：block 为块节点对象。
 * 返回值/副作用：返回 tiptap 节点；无副作用。
 */
function convertBlockNodeToTiptapNode(block: BlockNode): JSONContent {
  switch (block.type) {
    case 'paragraph':
      return { type: 'paragraph', content: inlineTextArrayToTiptap(block.richText) };
    case 'heading':
      return { type: 'heading', attrs: { level: block.level }, content: inlineTextArrayToTiptap(block.richText) };
    case 'quote':
      return {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: inlineTextArrayToTiptap(block.richText) }],
      };
    case 'list':
      return {
        type: block.style === 'ordered' ? 'orderedList' : 'bulletList',
        content: block.items.map((item) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inlineTextArrayToTiptap(item) }],
        })),
      };
    case 'code':
      return {
        type: 'codeBlock',
        attrs: { language: block.language || null },
        content: [{ type: 'text', text: block.code || '' }],
      };
    case 'image':
      return {
        type: 'imageBlock',
        attrs: {
          src: block.url,
          alt: block.alt || 'article-image',
          caption: block.caption || '',
          align: 'center',
        },
      };
    case 'embed':
      return convertEmbedBlockToTiptapNode(block);
    case 'divider':
      return { type: 'divider' };
    default:
      return { type: 'paragraph', content: [{ type: 'text', text: '' }] };
  }
}

/**
 * 功能：将统一 embed 块转换为对应 tiptap 自定义节点 attrs，兼容现有编辑器节点定义。
 * 关键参数：block 为 embed 块节点。
 * 返回值/副作用：返回 tiptap 节点对象；无副作用。
 */
function convertEmbedBlockToTiptapNode(block: EmbedBlockNode): JSONContent {
  if (block.cardType === 'github') {
    return {
      type: 'embedGithub',
      attrs: {
        repo: readSnapshotString(block.snapshot, 'fullName') || readSnapshotString(block.snapshot, 'name'),
        url: block.url,
        snapshot: block.snapshot,
        snapshotAt: new Date().toISOString(),
        resolved: true,
        fallbackUrl: block.url,
      },
    };
  }
  if (block.cardType === 'music') {
    return {
      type: 'embedMusic',
      attrs: {
        provider: block.provider || readSnapshotString(block.snapshot, 'provider') || 'music',
        url: block.url,
        trackId: readSnapshotString(block.snapshot, 'trackId') || readSnapshotString(block.snapshot, 'id'),
        snapshot: block.snapshot,
        snapshotAt: new Date().toISOString(),
        resolved: true,
        fallbackUrl: block.url,
      },
    };
  }
  if (block.cardType === 'video') {
    return {
      type: 'embedVideo',
      attrs: {
        provider: block.provider || readSnapshotString(block.snapshot, 'provider') || 'video',
        url: block.url,
        videoId: readSnapshotString(block.snapshot, 'videoId'),
        title: readSnapshotString(block.snapshot, 'title'),
        description: readSnapshotString(block.snapshot, 'description'),
        coverUrl: readSnapshotString(block.snapshot, 'coverUrl'),
        fallbackUrl: block.url,
      },
    };
  }
  return {
    type: 'embedLink',
    attrs: {
      url: block.url,
      title: readSnapshotString(block.snapshot, 'title') || block.url,
      description: readSnapshotString(block.snapshot, 'description') || block.url,
      domain: readSnapshotString(block.snapshot, 'domain'),
      siteName: readSnapshotString(block.snapshot, 'siteName'),
      coverUrl: readSnapshotString(block.snapshot, 'coverUrl'),
    },
  };
}

/**
 * 功能：将 tiptap 行内节点数组转换为块协议 richText 数组。
 * 关键参数：nodes 为行内节点数组。
 * 返回值/副作用：返回 richText 数组；无副作用。
 */
function extractInlineTextArray(nodes: JSONContent[] | undefined): BlockInlineText[] {
  if (!Array.isArray(nodes)) {
    return [{ text: '' }];
  }

  const segments: BlockInlineText[] = [];
  nodes.forEach((node) => {
    if (node.type === 'hardBreak') {
      segments.push({ text: '\n' });
      return;
    }
    if (typeof node.text === 'string') {
      segments.push({
        text: node.text,
        marks: convertTiptapMarks(node.marks),
      });
      return;
    }
    if (Array.isArray(node.content)) {
      segments.push(...extractInlineTextArray(node.content));
    }
  });

  return segments.length > 0 ? segments : [{ text: '' }];
}

/**
 * 功能：将任意层级节点递归压平为 richText 数组，供引用等复合块转换使用。
 * 关键参数：nodes 为任意层级内容节点。
 * 返回值/副作用：返回 richText 数组；无副作用。
 */
function extractInlineTextArrayFromAny(nodes: JSONContent[] | undefined): BlockInlineText[] {
  if (!Array.isArray(nodes)) {
    return [{ text: '' }];
  }
  const flattened: BlockInlineText[] = [];
  nodes.forEach((node) => {
    if (Array.isArray(node.content)) {
      flattened.push(...extractInlineTextArray(node.content));
      return;
    }
    if (typeof node.text === 'string') {
      flattened.push({
        text: node.text,
        marks: convertTiptapMarks(node.marks),
      });
    }
  });
  return flattened.length > 0 ? flattened : [{ text: '' }];
}

/**
 * 功能：从 tiptap 列表节点提取多行 richText 列表项。
 * 关键参数：nodes 为 listItem 节点数组。
 * 返回值/副作用：返回列表项二维数组；无副作用。
 */
function extractListItems(nodes: JSONContent[] | undefined): BlockInlineText[][] {
  if (!Array.isArray(nodes)) {
    return [[{ text: '' }]];
  }
  const items: BlockInlineText[][] = [];
  nodes.forEach((node) => {
    if (node.type !== 'listItem') {
      return;
    }
    const paragraphs = Array.isArray(node.content) ? node.content : [];
    const richText = extractInlineTextArrayFromAny(paragraphs);
    items.push(richText);
  });
  return items.length > 0 ? items : [[{ text: '' }]];
}

/**
 * 功能：将 richText 数组转换为 tiptap 行内节点数组。
 * 关键参数：segments 为块协议行内文本片段。
 * 返回值/副作用：返回 tiptap 行内节点数组；无副作用。
 */
function inlineTextArrayToTiptap(segments: BlockInlineText[]): JSONContent[] {
  const normalized = segments.length > 0 ? segments : [{ text: '' }];
  return normalized.map((segment) => {
    const marks = convertBlockMarksToTiptapMarks(segment.marks);
    const markList = marks ?? [];
    return {
      type: 'text',
      text: segment.text ?? '',
      ...(markList.length > 0 ? { marks: markList } : {}),
    };
  });
}

/**
 * 功能：将 richText 数组拼接为纯文本字符串，供摘要与 fallback 展示使用。
 * 关键参数：segments 为块协议行内文本片段。
 * 返回值/副作用：返回纯文本；无副作用。
 */
function inlineTextArrayToPlain(segments: BlockInlineText[]): string {
  return segments.map((segment) => segment.text || '').join('');
}

/**
 * 功能：将 tiptap marks 映射为块协议 marks，保留粗体/斜体/代码/链接语义。
 * 关键参数：marks 为 tiptap marks。
 * 返回值/副作用：返回块协议 marks；无副作用。
 */
function convertTiptapMarks(marks: JSONContent['marks']): BlockInlineMark[] | undefined {
  if (!Array.isArray(marks) || marks.length === 0) {
    return undefined;
  }

  const mapped: BlockInlineMark[] = [];
  marks.forEach((mark) => {
    if (!mark?.type) {
      return;
    }
    if (mark.type === 'bold' || mark.type === 'italic' || mark.type === 'code') {
      mapped.push({ type: mark.type });
      return;
    }
    if (mark.type === 'link') {
      mapped.push({
        type: 'link',
        href: readAttrString(mark.attrs, 'href'),
      });
    }
  });
  return mapped.length > 0 ? mapped : undefined;
}

/**
 * 功能：将块协议 marks 转换为 tiptap marks，保证编辑器可回显行内样式。
 * 关键参数：marks 为块协议 marks。
 * 返回值/副作用：返回 tiptap marks 数组；无副作用。
 */
function convertBlockMarksToTiptapMarks(marks: BlockInlineMark[] | undefined): JSONContent['marks'] {
  if (!Array.isArray(marks) || marks.length === 0) {
    return [];
  }
  return marks.map((mark) => {
    if (mark.type === 'link') {
      return {
        type: 'link',
        attrs: {
          href: mark.href || '#',
        },
      };
    }
    return {
      type: mark.type,
    };
  });
}

/**
 * 功能：提取 tiptap 节点树纯文本，作为块迁移时的兜底内容。
 * 关键参数：nodes 为节点数组。
 * 返回值/副作用：返回纯文本；无副作用。
 */
function extractTextPlain(nodes: JSONContent[] | undefined): string {
  if (!Array.isArray(nodes)) {
    return '';
  }
  return nodes
    .map((node) => {
      if (typeof node.text === 'string') {
        return node.text;
      }
      if (Array.isArray(node.content)) {
        return extractTextPlain(node.content);
      }
      return '';
    })
    .join('');
}

/**
 * 功能：归一化标题等级，限制在 1-3 之间。
 * 关键参数：value 为原始标题等级。
 * 返回值/副作用：返回合法标题等级；无副作用。
 */
function normalizeHeadingLevel(value: unknown): 1 | 2 | 3 {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (numeric <= 1) {
    return 1;
  }
  if (numeric >= 3) {
    return 3;
  }
  return 2;
}

/**
 * 功能：从 attrs 对象中安全读取字符串字段。
 * 关键参数：attrs 为 attrs 对象；key 为字段名。
 * 返回值/副作用：返回字符串值，缺失时返回空字符串。
 */
function readAttrString(attrs: Record<string, unknown> | null | undefined, key: string): string {
  const value = attrs?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 功能：构建统一 embed 块节点，保留链接、提供方与 snapshot 数据。
 * 关键参数：cardType 为卡片类型；attrs 为 tiptap embed attrs。
 * 返回值/副作用：返回 embed 块对象；无副作用。
 */
function buildEmbedBlockNode(cardType: BlockCardType, attrs: Record<string, unknown> | null | undefined): EmbedBlockNode {
  const rawSnapshot = attrs?.snapshot;
  const snapshot = rawSnapshot && typeof rawSnapshot === 'object'
    ? rawSnapshot as Record<string, unknown>
    : {};

  const url = readAttrString(attrs, 'url') || readAttrString(attrs, 'fallbackUrl');
  const provider = readAttrString(attrs, 'provider');

  return {
    type: 'embed',
    cardType,
    provider,
    url,
    snapshot,
  };
}

/**
 * 功能：从 embed snapshot 中安全读取字符串字段。
 * 关键参数：snapshot 为快照对象；key 为字段名。
 * 返回值/副作用：返回字符串值，缺失时返回空字符串。
 */
function readSnapshotString(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot[key];
  return typeof value === 'string' ? value : '';
}
