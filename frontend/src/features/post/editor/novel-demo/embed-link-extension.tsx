'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { ChevronDown, Clapperboard, Globe, Link2, LoaderCircle, Music2, RefreshCw, Upload } from 'lucide-react';
import { type MutableRefObject, useRef, useState } from 'react';
import {
  createEmbedId,
  createEmptyEmbedAttrs,
  createPendingEmbedAttrs,
  createUploadedImageEmbedAttrs,
  normalizeEmbedUrl,
  resolveAndHydrateEmbedCard,
  type EmbedLinkAttrs,
} from '@/features/post/editor/novel-demo/embed-link';
import { resolveUploadErrorMessage, uploadAssetFile } from '@/features/post/editor/novel-demo/upload';

interface EmbedLinkExtensionOptions {
  HTMLAttributes: Record<string, string>;
}

type CardPanelMode = 'link' | 'upload';

type CardRenderVariant = 'default' | 'netease-music' | 'bilibili-video';

interface EmbedLinkModePanelProps {
  panelMode: CardPanelMode;
  isExpanded: boolean;
  inputValue: string;
  pending: boolean;
  uploadInputRef: MutableRefObject<HTMLInputElement | null>;
  onToggleExpanded: () => void;
  onSwitchMode: (mode: CardPanelMode) => void;
  onInputChange: (nextValue: string) => void;
  onSubmitResolve: () => Promise<void>;
  onUploadChange: (file: File) => Promise<void>;
}

/**
 * 功能：从 attrs 中安全读取 snapshot 对象，避免空值或非法结构导致渲染异常。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回可用 snapshot 对象；无副作用。
 */
function readSnapshot(attrs: Partial<EmbedLinkAttrs>): Record<string, unknown> {
  if (!attrs.snapshot || typeof attrs.snapshot !== 'object' || Array.isArray(attrs.snapshot)) {
    return {};
  }
  return attrs.snapshot;
}

/**
 * 功能：根据节点 attrs 选择卡片渲染模板，优先命中平台专用样式。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回渲染模板标识；无副作用。
 */
function resolveCardRenderVariant(attrs: Partial<EmbedLinkAttrs>): CardRenderVariant {
  if (attrs.cardType === 'music' && attrs.provider === 'netease') {
    return 'netease-music';
  }
  if (attrs.cardType === 'video' && attrs.provider === 'bilibili') {
    return 'bilibili-video';
  }
  return 'default';
}

/**
 * 功能：根据 attrs 推导编辑态卡片面板默认模式，上传卡片回显时自动进入上传视图。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回面板模式 `link` 或 `upload`；无副作用。
 */
function resolvePanelMode(attrs: Partial<EmbedLinkAttrs>): CardPanelMode {
  if (attrs.uploadKind === 'image' || attrs.provider === 'upload' || attrs.cardType === 'image') {
    return 'upload';
  }
  return 'link';
}

/**
 * 功能：计算卡片输入面板初始展开状态，保证异常态与已有数据可直接编辑。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回是否默认展开；无副作用。
 */
function resolvePanelExpanded(attrs: Partial<EmbedLinkAttrs>): boolean {
  if (attrs.pending || Boolean(attrs.error)) {
    return true;
  }
  if (Boolean(attrs.url) || Boolean(attrs.normalizedUrl)) {
    return true;
  }
  if (attrs.uploadKind === 'image' || attrs.provider === 'upload') {
    return true;
  }
  return false;
}

/**
 * 功能：根据当前节点 attrs 生成卡片展示标题，保障占位态和降级态均可读。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回标题文本；无副作用。
 */
function resolveEmbedCardTitle(attrs: Partial<EmbedLinkAttrs>): string {
  return attrs.title || attrs.siteName || attrs.domain || attrs.normalizedUrl || attrs.url || '通用链接卡片';
}

/**
 * 功能：根据节点 attrs 生成卡片描述文案，区分解析中、失败态和普通态。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回描述文本；无副作用。
 */
function resolveEmbedCardDescription(attrs: Partial<EmbedLinkAttrs>): string {
  if (attrs.pending) {
    return '正在处理中，请稍候...';
  }
  if (attrs.error) {
    return attrs.error;
  }
  return attrs.description || '输入链接并回车，或切换到上传模式生成卡片。';
}

/**
 * 功能：读取网易云卡片展示所需歌手字段，优先使用 attrs，其次回退 snapshot。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回歌手文本或空字符串；无副作用。
 */
function resolveNeteaseArtist(attrs: Partial<EmbedLinkAttrs>): string {
  if (attrs.artist) {
    return attrs.artist;
  }

  const snapshot = readSnapshot(attrs);
  const artist = snapshot.artist;
  return typeof artist === 'string' ? artist : '';
}

/**
 * 功能：读取 B 站卡片展示所需视频 ID，优先使用 attrs，其次回退 snapshot。
 * 关键参数：attrs 为 embedLink 节点属性。
 * 返回值/副作用：返回视频 ID（如 BV/av）或空字符串；无副作用。
 */
function resolveBilibiliVideoId(attrs: Partial<EmbedLinkAttrs>): string {
  if (attrs.videoId) {
    return attrs.videoId;
  }

  const snapshot = readSnapshot(attrs);
  const videoId = snapshot.videoId;
  return typeof videoId === 'string' ? videoId : '';
}

/**
 * 功能：将 snapshot 属性序列化为 data-attribute 字符串，保证 tiptap-json 与 HTML 互转可恢复。
 * 关键参数：snapshot 为节点属性中的 snapshot 对象。
 * 返回值/副作用：返回 JSON 字符串；无副作用。
 */
function stringifySnapshotAttribute(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return '{}';
  }

  try {
    return JSON.stringify(snapshot);
  } catch {
    return '{}';
  }
}

/**
 * 功能：解析 HTML `data-snapshot` 字段并恢复为对象，异常时回退空对象。
 * 关键参数：rawValue 为属性原始字符串。
 * 返回值/副作用：返回 snapshot 对象；无副作用。
 */
function parseSnapshotAttribute(rawValue: string | null): Record<string, unknown> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * 功能：渲染可折叠的输入面板组件，点击卡片后再显示链接解析与上传图片信息。
 * 关键参数：props 包含当前面板模式、展开状态、输入值与交互回调。
 * 返回值/副作用：返回面板节点；副作用为触发回调更新节点 attrs。
 */
function EmbedLinkModePanel({
  panelMode,
  isExpanded,
  inputValue,
  pending,
  uploadInputRef,
  onToggleExpanded,
  onSwitchMode,
  onInputChange,
  onSubmitResolve,
  onUploadChange,
}: EmbedLinkModePanelProps) {
  return (
    <div className="gmp-embed-link-control">
      <button type="button" className="gmp-embed-link-trigger" onClick={onToggleExpanded} aria-expanded={isExpanded}>
        <span className="gmp-embed-link-trigger-leading">
          <Globe className="h-4 w-4" />
        </span>
        <span className="gmp-embed-link-trigger-copy">
          <strong>嵌入任何内容</strong>
          <small>PDF、Google 文档、地图、音乐、视频链接等</small>
        </span>
        <ChevronDown className="h-4 w-4 gmp-embed-link-trigger-chevron" data-expanded={isExpanded ? 'true' : 'false'} />
      </button>

      {isExpanded ? (
        <div className="gmp-embed-link-panel" data-mode={panelMode}>
          <div className="gmp-embed-link-panel-toggle" role="tablist" aria-label="卡片模式切换">
            <button
              type="button"
              role="tab"
              aria-selected={panelMode === 'link'}
              className="gmp-embed-link-panel-tab"
              data-active={panelMode === 'link' ? 'true' : 'false'}
              onClick={() => onSwitchMode('link')}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>链接</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelMode === 'upload'}
              className="gmp-embed-link-panel-tab"
              data-active={panelMode === 'upload' ? 'true' : 'false'}
              onClick={() => onSwitchMode('upload')}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>上传</span>
            </button>
          </div>

          {panelMode === 'link' ? (
            <label className="gmp-embed-link-input-wrapper" aria-label="链接卡片输入">
              <span className="gmp-embed-link-input-icon" aria-hidden="true">
                <Globe className="h-4 w-4" />
              </span>
              <input
                value={inputValue}
                onChange={(event) => {
                  onInputChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void onSubmitResolve();
                  }
                }}
                placeholder="粘贴链接后按回车"
                className="gmp-embed-link-input"
              />
              <button
                type="button"
                className="gmp-embed-link-action"
                onClick={() => {
                  void onSubmitResolve();
                }}
                aria-label="解析链接卡片"
              >
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </button>
            </label>
          ) : (
            <div className="gmp-embed-link-upload-panel">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const selectedFile = event.target.files?.item(0);
                  event.target.value = '';
                  if (!selectedFile) {
                    return;
                  }
                  void onUploadChange(selectedFile);
                }}
              />
              <button
                type="button"
                className="gmp-embed-link-upload-button"
                onClick={() => {
                  uploadInputRef.current?.click();
                }}
                aria-label="选择图片上传"
              >
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{pending ? '上传中...' : '选择图片并生成卡片'}</span>
              </button>
              <p className="gmp-embed-link-upload-hint">支持 `JPEG / PNG / WebP / GIF / AVIF / HEIC / HEIF`，单文件不超过 `8MB`。</p>
              <p className="gmp-embed-link-upload-hint">PDF 上传能力仅保留代码结构，本次界面不开放入口。</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 功能：渲染 embedLink 节点视图，支持输入链接、上传图片与平台专用卡片展示。
 * 关键参数：props 为 Tiptap NodeView 参数（含 node/editor/updateAttributes）。
 * 返回值/副作用：返回链接卡片节点；副作用为触发节点 attrs 更新与元数据请求。
 */
function EmbedLinkCardView({ node, editor, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as Partial<EmbedLinkAttrs>;
  const inputValue = attrs.url || attrs.normalizedUrl || '';
  const [panelMode, setPanelMode] = useState<CardPanelMode>(() => resolvePanelMode(attrs));
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(() => resolvePanelExpanded(attrs));
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * 功能：提交当前输入链接并触发卡片异步解析，失败时保留本地降级卡片。
   * 关键参数：无（闭包读取 inputValue 与节点 attrs）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新节点 attrs 并发起网络请求。
   */
  const submitResolve = async (): Promise<void> => {
    const rawUrl = inputValue.trim();
    const existingEmbedId = typeof attrs.embedId === 'string' && attrs.embedId ? attrs.embedId : createEmbedId();

    if (!rawUrl) {
      updateAttributes(createEmptyEmbedAttrs(existingEmbedId));
      return;
    }

    const normalizedUrl = normalizeEmbedUrl(rawUrl);
    if (!normalizedUrl) {
      updateAttributes({
        ...createPendingEmbedAttrs(rawUrl, existingEmbedId),
        pending: false,
        resolved: false,
        error: '请输入有效的 http 或 https 链接。',
      });
      return;
    }

    updateAttributes(createPendingEmbedAttrs(rawUrl, existingEmbedId));
    await resolveAndHydrateEmbedCard(editor.view, existingEmbedId, normalizedUrl);
  };

  /**
   * 功能：在上传模式中处理图片上传并直接生成卡片节点，失败时输出可定位错误。
   * 关键参数：file 为本地待上传图片文件。
   * 返回值/副作用：返回 Promise<void>；副作用为调用上传接口并更新卡片 attrs。
   */
  const submitImageUpload = async (file: File): Promise<void> => {
    const existingEmbedId = typeof attrs.embedId === 'string' && attrs.embedId ? attrs.embedId : createEmbedId();
    updateAttributes({
      ...createEmptyEmbedAttrs(existingEmbedId),
      cardType: 'image',
      mediaType: 'image',
      provider: 'upload',
      uploadKind: 'image',
      title: file.name || '上传图片卡片',
      pending: true,
      resolved: false,
      error: '',
      snapshot: {
        fileName: file.name || '',
        fileSize: file.size,
        mimeType: file.type || '',
        mediaType: 'image',
        provider: 'upload',
      },
    });

    try {
      const uploaded = await uploadAssetFile(file, 'image');
      updateAttributes(
        createUploadedImageEmbedAttrs(uploaded.url, {
          embedId: existingEmbedId,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
        }),
      );
    } catch (error) {
      updateAttributes({
        ...createEmptyEmbedAttrs(existingEmbedId),
        cardType: 'image',
        mediaType: 'image',
        provider: 'upload',
        uploadKind: 'image',
        title: file.name || '上传图片卡片',
        pending: false,
        resolved: false,
        error: resolveUploadErrorMessage(error),
        snapshot: {
          fileName: file.name || '',
          fileSize: file.size,
          mimeType: file.type || '',
          mediaType: 'image',
          provider: 'upload',
        },
      });
    }
  };

  const showInputPanel = editor.isEditable;
  const displayUrl = attrs.normalizedUrl || attrs.url || '';
  const cardVariant = resolveCardRenderVariant(attrs);
  const artist = resolveNeteaseArtist(attrs);
  const bilibiliVideoId = resolveBilibiliVideoId(attrs);
  const activePanelMode = resolvePanelMode(attrs) === 'upload' ? 'upload' : panelMode;
  const activeExpandedState = isPanelExpanded || Boolean(attrs.pending) || Boolean(attrs.error);
  const shouldRenderBody = Boolean(attrs.pending || attrs.error || attrs.resolved || displayUrl || attrs.coverUrl);

  return (
    <NodeViewWrapper className="gmp-embed-link-card not-prose">
      <section className="gmp-embed-link-shell">
        {showInputPanel ? (
          <EmbedLinkModePanel
            panelMode={activePanelMode}
            isExpanded={activeExpandedState}
            inputValue={inputValue}
            pending={Boolean(attrs.pending)}
            uploadInputRef={uploadInputRef}
            onToggleExpanded={() => {
              setIsPanelExpanded((previous) => !previous);
            }}
            onSwitchMode={(mode) => {
              setPanelMode(mode);
              setIsPanelExpanded(true);
            }}
            onInputChange={(nextValue) => {
              updateAttributes({
                ...createEmptyEmbedAttrs(typeof attrs.embedId === 'string' ? attrs.embedId : createEmbedId()),
                url: nextValue,
              });
            }}
            onSubmitResolve={submitResolve}
            onUploadChange={submitImageUpload}
          />
        ) : null}

        {shouldRenderBody ? (
          <div className="gmp-embed-link-body" data-pending={attrs.pending ? 'true' : 'false'}>
            <div className="gmp-embed-link-body-text">
              {cardVariant === 'netease-music' ? (
                <>
                  <p className="gmp-embed-link-provider-tag">
                    <Music2 className="h-3.5 w-3.5" />
                    <span>网易云音乐</span>
                  </p>
                  <p className="gmp-embed-link-title">{resolveEmbedCardTitle(attrs)}</p>
                  <p className="gmp-embed-link-description">{artist || resolveEmbedCardDescription(attrs)}</p>
                </>
              ) : cardVariant === 'bilibili-video' ? (
                <>
                  <p className="gmp-embed-link-provider-tag">
                    <Clapperboard className="h-3.5 w-3.5" />
                    <span>B站视频</span>
                    {bilibiliVideoId ? <strong className="gmp-embed-link-provider-id">{bilibiliVideoId}</strong> : null}
                  </p>
                  <p className="gmp-embed-link-title">{resolveEmbedCardTitle(attrs)}</p>
                  <p className="gmp-embed-link-description">{resolveEmbedCardDescription(attrs)}</p>
                </>
              ) : (
                <>
                  <p className="gmp-embed-link-title">{resolveEmbedCardTitle(attrs)}</p>
                  <p className="gmp-embed-link-description">{resolveEmbedCardDescription(attrs)}</p>
                </>
              )}

              {displayUrl ? (
                <a href={displayUrl} target="_blank" rel="noreferrer noopener" className="gmp-embed-link-url">
                  <Link2 className="h-3.5 w-3.5" />
                  <span>{displayUrl}</span>
                </a>
              ) : (
                <p className="gmp-embed-link-hint">点击上方卡片展开后，可继续编辑链接或切换到上传模式。</p>
              )}
            </div>

            {attrs.coverUrl ? (
              <div className="gmp-embed-link-cover-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attrs.coverUrl} alt={resolveEmbedCardTitle(attrs)} className="gmp-embed-link-cover" />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </NodeViewWrapper>
  );
}

/**
 * 功能：定义通用链接卡片块级节点，保持 tiptap-json 协议下可编辑与可渲染一致。
 * 关键参数：无。
 * 返回值/副作用：返回 embedLink 节点扩展实例；无副作用。
 */
export const embedLinkExtension = Node.create<EmbedLinkExtensionOptions>({
  name: 'embedLink',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  /**
   * 功能：声明扩展默认参数，集中控制节点 HTMLAttributes 的兜底值。
   * 关键参数：无。
   * 返回值/副作用：返回扩展默认配置对象；无副作用。
   */
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  /**
   * 功能：定义 embedLink 节点属性，确保文档序列化后可完整恢复卡片状态。
   * 关键参数：无。
   * 返回值/副作用：返回 attrs 描述对象；无副作用。
   */
  addAttributes() {
    return {
      embedId: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-embed-id') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-embed-id': String(attributes.embedId ?? '') }),
      },
      url: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-url') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-url': String(attributes.url ?? '') }),
      },
      normalizedUrl: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-normalized-url') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-normalized-url': String(attributes.normalizedUrl ?? '') }),
      },
      cardType: {
        default: 'link',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-card-type') ?? 'link',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-card-type': String(attributes.cardType ?? 'link') }),
      },
      mediaType: {
        default: 'link',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-media-type') ?? 'link',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-media-type': String(attributes.mediaType ?? 'link') }),
      },
      provider: {
        default: 'link',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-provider') ?? 'link',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-provider': String(attributes.provider ?? 'link') }),
      },
      title: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-title') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-title': String(attributes.title ?? '') }),
      },
      description: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-description') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-description': String(attributes.description ?? '') }),
      },
      artist: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-artist') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-artist': String(attributes.artist ?? '') }),
      },
      videoId: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-video-id') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-video-id': String(attributes.videoId ?? '') }),
      },
      coverUrl: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-cover-url') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-cover-url': String(attributes.coverUrl ?? '') }),
      },
      domain: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-domain') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-domain': String(attributes.domain ?? '') }),
      },
      siteName: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-site-name') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-site-name': String(attributes.siteName ?? '') }),
      },
      uploadKind: {
        default: 'none',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-upload-kind') ?? 'none',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-upload-kind': String(attributes.uploadKind ?? 'none') }),
      },
      snapshot: {
        default: {},
        parseHTML: (element: HTMLElement) => parseSnapshotAttribute(element.getAttribute('data-snapshot')),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-snapshot': stringifySnapshotAttribute(attributes.snapshot),
        }),
      },
      pending: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-pending') === 'true',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-pending': String(Boolean(attributes.pending)) }),
      },
      resolved: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-resolved') === 'true',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-resolved': String(Boolean(attributes.resolved)) }),
      },
      error: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-error') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-error': String(attributes.error ?? '') }),
      },
    };
  },

  /**
   * 功能：声明 embedLink 节点的 HTML 反序列化入口，支持阅读态与编辑态共用解析规则。
   * 关键参数：无。
   * 返回值/副作用：返回匹配规则数组；无副作用。
   */
  parseHTML() {
    return [
      {
        tag: 'section[data-type="embed-link"]',
      },
    ];
  },

  /**
   * 功能：定义 embedLink 节点的 HTML 序列化输出，保证脱离 NodeView 时仍可回退展示链接。
   * 关键参数：HTMLAttributes 为节点属性对象。
   * 返回值/副作用：返回 tiptap DOMOutputSpec；无副作用。
   */
  renderHTML({ HTMLAttributes }) {
    const normalizedUrl = String(HTMLAttributes.normalizedUrl ?? HTMLAttributes.url ?? '');
    const fallbackTitle = String((HTMLAttributes.title ?? normalizedUrl) || '通用链接卡片');
    return [
      'section',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'embed-link' }),
      [
        'a',
        {
          href: normalizedUrl || '#',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        fallbackTitle,
      ],
    ];
  },

  /**
   * 功能：挂载 React NodeView 渲染器，使链接卡片支持输入与异步解析交互。
   * 关键参数：无。
   * 返回值/副作用：返回 NodeView 渲染函数；无副作用。
   */
  addNodeView() {
    return ReactNodeViewRenderer(EmbedLinkCardView);
  },
});
