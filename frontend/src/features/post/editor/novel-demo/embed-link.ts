import type { EditorInstance } from 'novel';
import type { EditorView } from '@tiptap/pm/view';
import type { Range } from '@tiptap/core';
import { fetchEmbedResolve, type EmbedResolveResponse } from '@/features/post/editor/novel-demo/embed-api';

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;

export interface EmbedLinkAttrs {
  embedId: string;
  url: string;
  normalizedUrl: string;
  cardType: string;
  mediaType: string;
  provider: string;
  title: string;
  description: string;
  artist: string;
  videoId: string;
  coverUrl: string;
  domain: string;
  siteName: string;
  uploadKind: string;
  snapshot: Record<string, unknown>;
  pending: boolean;
  resolved: boolean;
  error: string;
}

/**
 * 功能：生成可定位的链接卡片节点 ID，便于异步回填时精确更新目标节点。
 * 关键参数：无。
 * 返回值/副作用：返回唯一 ID 字符串；无副作用。
 */
export function createEmbedId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `embed-${timestamp}-${randomPart}`;
}

/**
 * 功能：标准化链接输入并只允许 http/https，避免将非法协议写入卡片节点。
 * 关键参数：input 为用户输入或剪贴板文本。
 * 返回值/副作用：返回规范化 URL，非法输入返回空字符串；无副作用。
 */
export function normalizeEmbedUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+\-.]*):/i);
  if (schemeMatch && !HTTP_SCHEME_PATTERN.test(trimmed)) {
    return '';
  }

  const candidate = HTTP_SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * 功能：从 URL 提取展示域名，用于链接卡片未完成解析时的基础信息展示。
 * 关键参数：url 为规范化链接。
 * 返回值/副作用：返回域名字符串，异常时返回空字符串；无副作用。
 */
export function resolveEmbedDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * 功能：构造空白占位卡片 attrs，供 slash 命令直接插入可输入卡片。
 * 关键参数：embedId 为卡片节点唯一标识。
 * 返回值/副作用：返回空白卡片 attrs；无副作用。
 */
export function createEmptyEmbedAttrs(embedId: string = createEmbedId()): EmbedLinkAttrs {
  return {
    embedId,
    url: '',
    normalizedUrl: '',
    cardType: 'link',
    mediaType: 'link',
    provider: 'link',
    title: '',
    description: '',
    artist: '',
    videoId: '',
    coverUrl: '',
    domain: '',
    siteName: '',
    uploadKind: 'none',
    snapshot: {},
    pending: false,
    resolved: false,
    error: '',
  };
}

/**
 * 功能：根据输入链接构造待解析态 attrs，确保卡片可先展示基础信息再异步补全。
 * 关键参数：inputUrl 为原始输入链接；embedId 为卡片节点唯一标识。
 * 返回值/副作用：返回待解析卡片 attrs；无副作用。
 */
export function createPendingEmbedAttrs(inputUrl: string, embedId: string = createEmbedId()): EmbedLinkAttrs {
  const normalizedUrl = normalizeEmbedUrl(inputUrl);
  const domain = resolveEmbedDomain(normalizedUrl);
  return {
    embedId,
    url: inputUrl.trim(),
    normalizedUrl,
    cardType: 'link',
    mediaType: 'link',
    provider: 'link',
    title: normalizedUrl,
    description: '',
    artist: '',
    videoId: '',
    coverUrl: '',
    domain,
    siteName: '',
    uploadKind: 'none',
    snapshot: {
      url: normalizedUrl,
      domain,
    },
    pending: true,
    resolved: false,
    error: '',
  };
}

/**
 * 功能：根据上传成功的图片信息构造统一卡片 attrs，确保上传后直接落地为 embedLink 节点。
 * 关键参数：uploadedUrl 为上传成功地址；embedId 为目标节点标识；fileName/fileSize/mimeType 为可选展示元信息。
 * 返回值/副作用：返回完整图片卡片 attrs；无副作用。
 */
export function createUploadedImageEmbedAttrs(
  uploadedUrl: string,
  options?: {
    embedId?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  },
): EmbedLinkAttrs {
  const normalizedUrl = normalizeEmbedUrl(uploadedUrl);
  const domain = resolveEmbedDomain(normalizedUrl);
  const embedId = options?.embedId || createEmbedId();
  const fileName = options?.fileName ?? '';
  const fileSize = typeof options?.fileSize === 'number' ? options.fileSize : 0;
  const mimeType = options?.mimeType ?? '';
  const title = fileName || normalizedUrl || '上传图片卡片';

  return {
    embedId,
    url: uploadedUrl,
    normalizedUrl,
    cardType: 'image',
    mediaType: 'image',
    provider: 'upload',
    title,
    description: fileSize > 0 ? `已上传图片 · ${(fileSize / 1024).toFixed(1)}KB` : '已上传图片',
    artist: '',
    videoId: '',
    coverUrl: normalizedUrl,
    domain,
    siteName: 'Upload',
    uploadKind: 'image',
    snapshot: {
      url: normalizedUrl,
      fileName,
      fileSize,
      mimeType,
      domain,
      provider: 'upload',
      mediaType: 'image',
    },
    pending: false,
    resolved: true,
    error: '',
  };
}

/**
 * 功能：判断剪贴板文本是否为单一 URL，避免误将普通段落粘贴转换为链接卡片。
 * 关键参数：event 为原始剪贴板事件。
 * 返回值/副作用：返回可转换的 URL 字符串或 null；无副作用。
 */
export function extractSingleUrlFromClipboard(event: ClipboardEvent): string | null {
  const rawText = event.clipboardData?.getData('text/plain')?.trim() ?? '';
  if (!rawText || /\s/.test(rawText)) {
    return null;
  }

  const normalizedUrl = normalizeEmbedUrl(rawText);
  return normalizedUrl || null;
}

/**
 * 功能：在 slash 命令范围内插入链接卡片节点，支持空占位或带初始 URL 的插入。
 * 关键参数：editor 为编辑器实例；range 为 slash 命令替换范围；inputUrl 为可选初始链接。
 * 返回值/副作用：返回插入的卡片节点 ID；副作用为修改编辑器文档。
 */
export function insertEmbedCardAtRange(editor: EditorInstance, range: Range, inputUrl = ''): string {
  const attrs = inputUrl ? createPendingEmbedAttrs(inputUrl) : createEmptyEmbedAttrs();
  editor.chain().focus().deleteRange(range).insertContent({ type: 'embedLink', attrs }).run();
  return attrs.embedId;
}

/**
 * 功能：判断当前选区是否位于空段落，以控制“粘贴 URL 自动转卡片”的触发边界。
 * 关键参数：view 为 ProseMirror 视图实例。
 * 返回值/副作用：返回是否满足转换条件；无副作用。
 */
export function canInsertEmbedCardAtSelection(view: EditorView): boolean {
  const { selection } = view.state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  if ($from.parent.type.name !== 'paragraph') {
    return false;
  }

  return $from.parent.textContent.trim().length === 0;
}

/**
 * 功能：在当前选区插入待解析链接卡片，并返回节点 ID 供后续异步回填。
 * 关键参数：view 为 ProseMirror 视图实例；url 为待转换链接。
 * 返回值/副作用：返回插入节点 ID，未插入时返回 null；副作用为修改编辑器文档。
 */
export function insertEmbedCardAtSelection(view: EditorView, url: string): string | null {
  if (!canInsertEmbedCardAtSelection(view)) {
    return null;
  }

  const nodeType = view.state.schema.nodes.embedLink;
  if (!nodeType) {
    return null;
  }

  const attrs = createPendingEmbedAttrs(url);
  const embedNode = nodeType.create(attrs);
  const nextTransaction = view.state.tr.replaceSelectionWith(embedNode).scrollIntoView();
  view.dispatch(nextTransaction);
  return attrs.embedId;
}

/**
 * 功能：根据 embedId 在文档中定位卡片节点并合并更新 attrs。
 * 关键参数：view 为 ProseMirror 视图实例；embedId 为目标节点 ID；patch 为增量 attrs。
 * 返回值/副作用：返回是否更新成功；副作用为派发事务更新文档。
 */
export function patchEmbedCardAttrs(view: EditorView, embedId: string, patch: Partial<EmbedLinkAttrs>): boolean {
  let locatedPosition: number | null = null;
  let currentAttrs: EmbedLinkAttrs | null = null;

  view.state.doc.descendants((node, position) => {
    if (node.type.name === 'embedLink' && String(node.attrs.embedId ?? '') === embedId) {
      locatedPosition = position;
      currentAttrs = node.attrs as EmbedLinkAttrs;
    }
    return true;
  });

  if (locatedPosition === null || currentAttrs === null) {
    return false;
  }

  const baseAttrs = currentAttrs as EmbedLinkAttrs;
  const nextAttrs: Record<string, unknown> = { ...baseAttrs, ...patch };
  const transaction = view.state.tr.setNodeMarkup(locatedPosition, undefined, nextAttrs);
  view.dispatch(transaction);
  return true;
}

/**
 * 功能：从 snapshot 中按 key 读取字符串字段，统一处理空值与类型不匹配。
 * 关键参数：snapshot 为后端返回的元信息对象；key 为目标字段名。
 * 返回值/副作用：返回可用字符串或空字符串；无副作用。
 */
function readSnapshotString(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 功能：在响应快照中读取对象字段并兜底为空对象，避免 attrs.snapshot 落入 null/数组等不可预期结构。
 * 关键参数：snapshot 为后端返回的 snapshot 字段。
 * 返回值/副作用：返回可安全写入 attrs 的对象；无副作用。
 */
function readSnapshotObject(snapshot: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return {};
  }
  return snapshot;
}

/**
 * 功能：将后端 Embed 解析响应映射为前端链接卡片 attrs 补丁。
 * 关键参数：response 为后端解析结果；fallbackUrl 为失败兜底链接。
 * 返回值/副作用：返回可直接 merge 的 attrs 增量对象；无副作用。
 */
export function mapEmbedResolveToAttrs(response: EmbedResolveResponse, fallbackUrl: string): Partial<EmbedLinkAttrs> {
  const snapshot = readSnapshotObject(response.snapshot);
  const normalizedUrl = response.normalizedUrl || readSnapshotString(snapshot, 'url') || fallbackUrl;
  const domain = readSnapshotString(snapshot, 'domain') || resolveEmbedDomain(normalizedUrl);
  const cardType = response.cardType || 'link';
  const provider = response.provider || 'link';
  const mediaType = readSnapshotString(snapshot, 'mediaType') || cardType;
  const resolved = Boolean(response.resolved);

  return {
    url: fallbackUrl,
    normalizedUrl,
    cardType,
    mediaType,
    provider,
    title: readSnapshotString(snapshot, 'title') || normalizedUrl,
    description: readSnapshotString(snapshot, 'description'),
    artist: readSnapshotString(snapshot, 'artist'),
    videoId: readSnapshotString(snapshot, 'videoId'),
    coverUrl: readSnapshotString(snapshot, 'coverUrl'),
    domain,
    siteName: readSnapshotString(snapshot, 'siteName'),
    uploadKind: 'none',
    snapshot,
    pending: false,
    resolved,
    error: resolved ? '' : '链接元数据解析失败，已降级显示基础卡片。',
  };
}

/**
 * 功能：按“先本地卡片、后异步补全”策略回填指定链接卡片节点。
 * 关键参数：view 为 ProseMirror 视图实例；embedId 为节点 ID；inputUrl 为原始链接。
 * 返回值/副作用：返回 Promise<void>；副作用为触发网络请求并更新编辑器节点。
 */
export async function resolveAndHydrateEmbedCard(view: EditorView, embedId: string, inputUrl: string): Promise<void> {
  const normalizedUrl = normalizeEmbedUrl(inputUrl);
  if (!normalizedUrl) {
    patchEmbedCardAttrs(view, embedId, {
      cardType: 'link',
      mediaType: 'link',
      provider: 'link',
      artist: '',
      videoId: '',
      uploadKind: 'none',
      snapshot: {},
      pending: false,
      resolved: false,
      error: '请输入有效的 http 或 https 链接。',
    });
    return;
  }

  patchEmbedCardAttrs(view, embedId, {
    cardType: 'link',
    mediaType: 'link',
    provider: 'link',
    pending: true,
    resolved: false,
    error: '',
    artist: '',
    videoId: '',
    uploadKind: 'none',
    url: inputUrl,
    normalizedUrl,
    domain: resolveEmbedDomain(normalizedUrl),
    title: normalizedUrl,
    description: '',
    coverUrl: '',
    siteName: '',
    snapshot: {
      url: normalizedUrl,
      domain: resolveEmbedDomain(normalizedUrl),
    },
  });

  try {
    const response = await fetchEmbedResolve(normalizedUrl);
    patchEmbedCardAttrs(view, embedId, mapEmbedResolveToAttrs(response, normalizedUrl));
  } catch {
    patchEmbedCardAttrs(view, embedId, {
      cardType: 'link',
      mediaType: 'link',
      provider: 'link',
      pending: false,
      resolved: false,
      error: '链接元数据解析失败，已降级显示基础卡片。',
      artist: '',
      videoId: '',
      uploadKind: 'none',
      normalizedUrl,
      domain: resolveEmbedDomain(normalizedUrl),
      title: normalizedUrl,
      description: '',
      coverUrl: '',
      siteName: '',
      snapshot: {
        url: normalizedUrl,
        domain: resolveEmbedDomain(normalizedUrl),
      },
    });
  }
}
