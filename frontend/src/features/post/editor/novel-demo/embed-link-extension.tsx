'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Globe, LoaderCircle, Link2, RefreshCw } from 'lucide-react';
import {
  createEmbedId,
  createEmptyEmbedAttrs,
  createPendingEmbedAttrs,
  normalizeEmbedUrl,
  resolveAndHydrateEmbedCard,
  type EmbedLinkAttrs,
} from '@/features/post/editor/novel-demo/embed-link';

interface EmbedLinkExtensionOptions {
  HTMLAttributes: Record<string, string>;
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
    return '正在解析链接元数据，请稍候...';
  }
  if (attrs.error) {
    return attrs.error;
  }
  return attrs.description || '输入链接并回车，可自动生成卡片预览。';
}

/**
 * 功能：渲染 embedLink 节点视图，支持输入链接、异步解析与卡片展示。
 * 关键参数：props 为 Tiptap NodeView 参数（含 node/editor/updateAttributes）。
 * 返回值/副作用：返回链接卡片节点；副作用为触发节点 attrs 更新与元数据请求。
 */
function EmbedLinkCardView({ node, editor, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as Partial<EmbedLinkAttrs>;
  const inputValue = attrs.url || attrs.normalizedUrl || '';

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

  const showInput = editor.isEditable;
  const displayUrl = attrs.normalizedUrl || attrs.url || '';

  return (
    <NodeViewWrapper className="gmp-embed-link-card not-prose">
      <section className="gmp-embed-link-shell">
        {showInput ? (
          <label className="gmp-embed-link-input-wrapper" aria-label="链接卡片输入">
            <span className="gmp-embed-link-input-icon" aria-hidden="true">
              <Globe className="h-4 w-4" />
            </span>
            <input
              value={inputValue}
              onChange={(event) => {
                updateAttributes({
                  url: event.target.value,
                  normalizedUrl: '',
                  title: '',
                  description: '',
                  coverUrl: '',
                  domain: '',
                  siteName: '',
                  pending: false,
                  resolved: false,
                  error: '',
                });
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void submitResolve();
                }
              }}
              placeholder="嵌入任何内容（PDF、Google 文档、地图、音乐、网页等）"
              className="gmp-embed-link-input"
            />
            <button
              type="button"
              className="gmp-embed-link-action"
              onClick={() => {
                void submitResolve();
              }}
              aria-label="解析链接卡片"
            >
              {attrs.pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </label>
        ) : null}

        <div className="gmp-embed-link-body" data-pending={attrs.pending ? 'true' : 'false'}>
          <div className="gmp-embed-link-body-text">
            <p className="gmp-embed-link-title">{resolveEmbedCardTitle(attrs)}</p>
            <p className="gmp-embed-link-description">{resolveEmbedCardDescription(attrs)}</p>
            {displayUrl ? (
              <a href={displayUrl} target="_blank" rel="noreferrer noopener" className="gmp-embed-link-url">
                <Link2 className="h-3.5 w-3.5" />
                <span>{displayUrl}</span>
              </a>
            ) : (
              <p className="gmp-embed-link-hint">按 Enter 启用链接识别，或输入 / 启用命令</p>
            )}
          </div>

          {attrs.coverUrl ? (
            <div className="gmp-embed-link-cover-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attrs.coverUrl} alt={resolveEmbedCardTitle(attrs)} className="gmp-embed-link-cover" />
            </div>
          ) : null}
        </div>
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
