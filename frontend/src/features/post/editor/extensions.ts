import type { RefObject } from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import {
  Command,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapLink,
  UpdatedImage,
  createSuggestionItems,
  renderItems,
  type SuggestionItem,
} from 'novel';
import type { SlashCommandItem } from '@/features/post/editor/types';

interface EmbedNodeConfig {
  nodeType: 'embedGithub' | 'embedMusic' | 'embedVideo' | 'embedLink';
  dataType: 'embed-github' | 'embed-music' | 'embed-video' | 'embed-link';
  providerLabel: string;
}

interface BuildPostEditorExtensionsOptions {
  placeholder: string;
  slashItems: SlashCommandItem[];
  commandHostRef?: RefObject<Element>;
}

const EMBED_NODE_CONFIGS: EmbedNodeConfig[] = [
  { nodeType: 'embedGithub', dataType: 'embed-github', providerLabel: 'GITHUB' },
  { nodeType: 'embedMusic', dataType: 'embed-music', providerLabel: 'MUSIC' },
  { nodeType: 'embedVideo', dataType: 'embed-video', providerLabel: 'VIDEO' },
  { nodeType: 'embedLink', dataType: 'embed-link', providerLabel: 'LINK' },
];

/**
 * 功能：从节点 attrs 中安全读取字符串字段，避免渲染阶段出现 undefined。
 * 关键参数：attrs 为节点属性对象；key 为目标字段。
 * 返回值/副作用：返回裁剪后的字符串；不存在时返回空字符串。
 */
function readStringAttr(attrs: Record<string, unknown>, key: string): string {
  const value = attrs[key];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 功能：基于 embed 节点属性生成卡片标题，保证无元数据时仍有可读标题。
 * 关键参数：attrs 为 embed 节点属性；fallbackUrl 为回退链接。
 * 返回值/副作用：返回可展示标题文本；无副作用。
 */
function resolveEmbedCardTitle(attrs: Record<string, unknown>, fallbackUrl: string): string {
  return readStringAttr(attrs, 'title') || readStringAttr(attrs, 'siteName') || fallbackUrl;
}

/**
 * 功能：构建空外链卡片专用提示文案，优先使用节点 attrs 中的自定义标题。
 * 关键参数：attrs 为 embed 节点属性；providerLabel 为节点 provider 文案。
 * 返回值/副作用：返回占位输入条展示文本；无副作用。
 */
function resolveEmbedPlaceholderTitle(attrs: Record<string, unknown>, providerLabel: string): string {
  const customTitle = readStringAttr(attrs, 'title');
  if (customTitle) {
    return customTitle;
  }

  if (providerLabel === 'LINK') {
    return '嵌入任何内容（PDF、Google 文档、Google 地图、Spotify 等）';
  }

  return `嵌入 ${providerLabel} 资源或通用外链`;
}

/**
 * 功能：构建空外链卡片说明文案，优先读取 attrs 中自定义描述。
 * 关键参数：attrs 为 embed 节点属性。
 * 返回值/副作用：返回占位提示文本；无副作用。
 */
function resolveEmbedPlaceholderHint(attrs: Record<string, unknown>): string {
  return readStringAttr(attrs, 'description') || '按 Space（空格）启用 AI，或按“/”启用命令';
}

/**
 * 功能：按配置创建 embed 原子块扩展，统一输出 section[data-type="embed-*"] 结构。
 * 关键参数：config 为节点类型映射配置。
 * 返回值/副作用：返回可挂载到 Tiptap 的节点扩展；无副作用。
 */
function createEmbedCardNode(config: EmbedNodeConfig): unknown {
  return Node.create({
    name: config.nodeType,
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return {
        provider: { default: config.providerLabel.toLowerCase() },
        url: { default: '' },
        fallbackUrl: { default: '' },
        resolved: { default: true },
        title: { default: '' },
        description: { default: '' },
        coverUrl: { default: '' },
        domain: { default: '' },
        siteName: { default: '' },
        artist: { default: '' },
        videoId: { default: '' },
        snapshot: { default: null },
      };
    },
    parseHTML() {
      return [{ tag: `section[data-type="${config.dataType}"]` }];
    },
    renderHTML({ node }) {
      const attrs = (node.attrs ?? {}) as Record<string, unknown>;
      const rawUrl = readStringAttr(attrs, 'url') || readStringAttr(attrs, 'fallbackUrl');
      const hasUrl = Boolean(rawUrl);
      const description = readStringAttr(attrs, 'description') || readStringAttr(attrs, 'domain') || readStringAttr(attrs, 'artist');
      const coverUrl = readStringAttr(attrs, 'coverUrl');
      const title = resolveEmbedCardTitle(attrs, rawUrl || '') || 'EMPTY CARD';
      const isEmptyCard = !hasUrl;

      const sectionAttrs = mergeAttributes({
        'data-type': config.dataType,
        'data-empty-card': isEmptyCard ? 'true' : 'false',
      });

      if (isEmptyCard) {
        return [
          'section',
          sectionAttrs,
          [
            'div',
            { 'data-role': 'embed-placeholder-card' },
            [
              'div',
              { 'data-role': 'embed-placeholder-input' },
              ['span', { 'data-role': 'embed-placeholder-icon', 'aria-hidden': 'true' }, '◎'],
              ['span', { 'data-role': 'embed-placeholder-text' }, resolveEmbedPlaceholderTitle(attrs, config.providerLabel)],
            ],
            ['div', { 'data-role': 'embed-placeholder-preview' }],
            ['p', { 'data-role': 'embed-placeholder-hint' }, resolveEmbedPlaceholderHint(attrs)],
          ],
        ];
      }

      const linkChildren: unknown[] = [];
      if (coverUrl) {
        linkChildren.push(['img', { src: coverUrl, alt: title }]);
      }
      linkChildren.push(['span', {}, `${config.providerLabel} CARD`]);
      linkChildren.push(['strong', {}, title]);
      if (description) {
        linkChildren.push(['p', {}, description]);
      }

      return [
        'section',
        sectionAttrs,
        [
          'a',
          {
            href: rawUrl,
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
          },
          ...linkChildren,
        ],
      ];
    },
    renderText({ node }) {
      const attrs = (node.attrs ?? {}) as Record<string, unknown>;
      const hasUrl = Boolean(readStringAttr(attrs, 'url') || readStringAttr(attrs, 'fallbackUrl'));
      if (!hasUrl) {
        return resolveEmbedPlaceholderTitle(attrs, config.providerLabel);
      }
      return resolveEmbedCardTitle(attrs, readStringAttr(attrs, 'url'));
    },
  });
}

/**
 * 功能：将业务层 slash 命令项转换为 Novel suggestion 项，供 Command 扩展消费。
 * 关键参数：slashItems 为业务命令列表。
 * 返回值/副作用：返回 suggestion 数组；无副作用。
 */
function mapSlashItemsToSuggestions(slashItems: SlashCommandItem[]): SuggestionItem[] {
  return createSuggestionItems(
    slashItems.map((item) => ({
      title: item.title,
      description: item.description,
      searchTerms: item.searchTerms,
      icon: item.icon,
      command: ({ editor, range }) => {
        void item.command({
          editor,
          range,
        });
      },
    })),
  );
}

/**
 * 功能：按用户输入过滤 slash suggestion，提升命令菜单检索效率。
 * 关键参数：items 为全部 suggestion；query 为当前检索词。
 * 返回值/副作用：返回过滤后 suggestion 数组；无副作用。
 */
function filterSuggestions(items: SuggestionItem[], query: string): SuggestionItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystacks = [item.title, item.description, ...(item.searchTerms ?? [])]
      .filter(Boolean)
      .map((segment) => segment.toLowerCase());
    return haystacks.some((segment) => segment.includes(normalizedQuery));
  });
}

/**
 * 功能：构建编辑态扩展集合，统一注入基础能力、slash 命令和 embed 节点。
 * 关键参数：options 包含占位文案、slash 列表与命令菜单挂载容器。
 * 返回值/副作用：返回扩展数组；无副作用。
 */
export function buildPostEditorExtensions(options: BuildPostEditorExtensionsOptions): unknown[] {
  const suggestionItems = mapSlashItemsToSuggestions(options.slashItems);

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TiptapLink.configure({
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
    }),
    UpdatedImage,
    ...EMBED_NODE_CONFIGS.map((config) => createEmbedCardNode(config)),
    Placeholder.configure({
      placeholder: options.placeholder,
    }),
    Command.configure({
      suggestion: {
        items: ({ query }: { query: string }) => filterSuggestions(suggestionItems, query),
        render: () => renderItems(options.commandHostRef ?? null),
      },
    }),
  ];
}

/**
 * 功能：构建阅读态扩展集合，保证阅读渲染与编辑器节点协议一致。
 * 关键参数：无。
 * 返回值/副作用：返回只读扩展数组；无副作用。
 */
export function buildPostRendererExtensions(): unknown[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TiptapLink.configure({
      openOnClick: true,
      autolink: false,
      linkOnPaste: false,
    }),
    UpdatedImage,
    ...EMBED_NODE_CONFIGS.map((config) => createEmbedCardNode(config)),
  ];
}
