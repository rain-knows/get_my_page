import { Node } from '@tiptap/core';

/**
 * 功能：将 attrs 中的宽高值安全转换为数字，避免渲染时出现 NaN。
 * 关键参数：value 为节点 attrs 中读取的原始值。
 * 返回值/副作用：返回合法数字或 null；无副作用。
 */
function normalizeNumberAttr(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * 功能：从链接中提取主机名用于卡片展示，解析失败时返回 UNKNOWN。
 * 关键参数：url 为用户输入或保存的链接。
 * 返回值/副作用：返回可展示域名字符串，无副作用。
 */
function safeParseHost(url: unknown): string {
  if (typeof url !== 'string' || !url.trim()) {
    return 'UNKNOWN';
  }

  try {
    return new URL(url).hostname || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * 功能：将链接标准化为可点击 URL，缺失协议时默认补全 https。
 * 关键参数：value 为原始链接值。
 * 返回值/副作用：返回标准化后的 URL 字符串，无副作用。
 */
function normalizeHref(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return '#';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

/**
 * 功能：从任意属性值中读取字符串并执行 trim，避免节点 attrs 混入非字符串类型。
 * 关键参数：value 为 attrs 原始值。
 * 返回值/副作用：返回标准化字符串，非字符串时返回空字符串。
 */
function readAttrString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 功能：从 attrs 中读取对象字段（如 snapshot），供卡片渲染提取元信息。
 * 关键参数：value 为 attrs 原始值。
 * 返回值/副作用：返回对象或 null，无副作用。
 */
function readAttrObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * 功能：从 snapshot 对象中读取指定字符串字段。
 * 关键参数：snapshot 为卡片快照对象；key 为字段名。
 * 返回值/副作用：返回字段字符串，缺失时返回空字符串。
 */
function readSnapshotString(snapshot: Record<string, unknown> | null, key: string): string {
  return readAttrString(snapshot?.[key]);
}

/**
 * 功能：从候选值中返回第一个非空字符串，统一卡片标题/描述回退规则。
 * 关键参数：values 为候选值列表。
 * 返回值/副作用：返回首个非空字符串，均为空时返回空字符串。
 */
function firstNonBlank(...values: unknown[]): string {
  for (const value of values) {
    const normalized = readAttrString(value);
    if (normalized) {
      return normalized;
    }
  }
  return '';
}

export const ImageBlockNode = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: 'article-image',
      },
      caption: {
        default: '',
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const width = normalizeNumberAttr(HTMLAttributes.width);
    const height = normalizeNumberAttr(HTMLAttributes.height);

    return [
      'figure',
      {
        'data-type': 'image-block',
        'data-align': HTMLAttributes.align,
        'data-caption': HTMLAttributes.caption,
      },
      [
        'img',
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt,
          width,
          height,
        },
      ],
      ['figcaption', {}, HTMLAttributes.caption || ''],
    ];
  },
});

export const EmbedGithubNode = Node.create({
  name: 'embedGithub',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      repo: {
        default: '',
      },
      url: {
        default: '',
      },
      snapshot: {
        default: null,
      },
      snapshotAt: {
        default: '',
      },
      resolved: {
        default: false,
      },
      fallbackUrl: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="embed-github"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    /**
     * 功能：渲染 GitHub 卡片的编辑态 DOM，尽量与阅读态保持一致。
     * 关键参数：HTMLAttributes 为节点属性（含 snapshot/url/fallbackUrl）。
     * 返回值/副作用：返回 tiptap DOMOutputSpec；无副作用。
     */
    const snapshot = readAttrObject(HTMLAttributes.snapshot);
    const href = normalizeHref(HTMLAttributes.url || HTMLAttributes.fallbackUrl);
    const repoName = firstNonBlank(
      readSnapshotString(snapshot, 'fullName'),
      readSnapshotString(snapshot, 'name'),
      HTMLAttributes.repo,
    );
    const description = firstNonBlank(readSnapshotString(snapshot, 'description'), href);
    const coverUrl = firstNonBlank(readSnapshotString(snapshot, 'coverUrl'), readSnapshotString(snapshot, 'avatarUrl'));
    const cardChildren: unknown[] = [
      ['span', {}, 'GITHUB CARD'],
    ];

    if (coverUrl) {
      cardChildren.push(['img', { src: coverUrl, alt: repoName || 'github-cover', loading: 'lazy' }]);
    }

    cardChildren.push(['strong', {}, repoName || 'GITHUB RESOURCE']);
    cardChildren.push(['p', {}, description]);

    return [
      'section',
      {
        'data-type': 'embed-github',
        'data-url': href,
        'data-repo': repoName,
      },
      ['a', { href, rel: 'noreferrer', target: '_blank' }, ...cardChildren],
    ];
  },
});

export const EmbedMusicNode = Node.create({
  name: 'embedMusic',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      provider: {
        default: '',
      },
      url: {
        default: '',
      },
      trackId: {
        default: '',
      },
      snapshot: {
        default: null,
      },
      snapshotAt: {
        default: '',
      },
      resolved: {
        default: false,
      },
      fallbackUrl: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="embed-music"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    /**
     * 功能：渲染音乐卡片的编辑态 DOM，展示平台、封面、标题与副文本。
     * 关键参数：HTMLAttributes 为节点属性（含 snapshot/provider/url）。
     * 返回值/副作用：返回 tiptap DOMOutputSpec；无副作用。
     */
    const snapshot = readAttrObject(HTMLAttributes.snapshot);
    const provider = readAttrString(HTMLAttributes.provider).toUpperCase() || 'MUSIC';
    const href = normalizeHref(HTMLAttributes.url || HTMLAttributes.fallbackUrl);
    const title = firstNonBlank(readSnapshotString(snapshot, 'title'), readSnapshotString(snapshot, 'name'), `${provider} RESOURCE`);
    const subtitle = firstNonBlank(
      readSnapshotString(snapshot, 'artist'),
      readSnapshotString(snapshot, 'description'),
      href,
    );
    const coverUrl = firstNonBlank(readSnapshotString(snapshot, 'coverUrl'));
    const cardChildren: unknown[] = [
      ['span', {}, `${provider} CARD`],
    ];

    if (coverUrl) {
      cardChildren.push(['img', { src: coverUrl, alt: title, loading: 'lazy' }]);
    }

    cardChildren.push(['strong', {}, title]);
    cardChildren.push(['p', {}, subtitle]);

    return [
      'section',
      {
        'data-type': 'embed-music',
        'data-url': href,
        'data-provider': provider,
      },
      ['a', { href, rel: 'noreferrer', target: '_blank' }, ...cardChildren],
    ];
  },
});

export const EmbedLinkNode = Node.create({
  name: 'embedLink',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      siteName: {
        default: '',
      },
      domain: {
        default: '',
      },
      coverUrl: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="embed-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    /**
     * 功能：渲染链接卡片编辑态 DOM，支持站点名/封面/标题/描述完整展示。
     * 关键参数：HTMLAttributes 为节点属性（含 url/siteName/coverUrl 等）。
     * 返回值/副作用：返回 tiptap DOMOutputSpec；无副作用。
     */
    const href = normalizeHref(HTMLAttributes.url);
    const title = firstNonBlank(HTMLAttributes.title, href);
    const description = firstNonBlank(HTMLAttributes.description, href);
    const domain = firstNonBlank(HTMLAttributes.domain, safeParseHost(href));
    const siteName = firstNonBlank(HTMLAttributes.siteName);
    const coverUrl = firstNonBlank(HTMLAttributes.coverUrl);
    const cardChildren: unknown[] = [
      ['span', {}, `LINK CARD · ${siteName || domain}`],
    ];

    if (coverUrl) {
      cardChildren.push(['img', { src: coverUrl, alt: title || 'link-cover', loading: 'lazy' }]);
    }

    cardChildren.push(['strong', {}, title]);
    cardChildren.push(['p', {}, description]);

    return [
      'section',
      {
        'data-type': 'embed-link',
        'data-url': href,
      },
      [
        'a',
        {
          href,
          rel: 'noreferrer',
          target: '_blank',
        },
        ...cardChildren,
      ],
    ];
  },
});

export const EmbedVideoNode = Node.create({
  name: 'embedVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      provider: {
        default: 'video',
      },
      url: {
        default: '',
      },
      videoId: {
        default: '',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      coverUrl: {
        default: '',
      },
      fallbackUrl: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="embed-video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    /**
     * 功能：渲染视频卡片编辑态 DOM，展示平台、封面、标题与回退链接信息。
     * 关键参数：HTMLAttributes 为节点属性（含 provider/title/coverUrl/url）。
     * 返回值/副作用：返回 tiptap DOMOutputSpec；无副作用。
     */
    const href = normalizeHref(HTMLAttributes.url || HTMLAttributes.fallbackUrl);
    const provider = readAttrString(HTMLAttributes.provider).toUpperCase() || 'VIDEO';
    const title = firstNonBlank(HTMLAttributes.title, `${provider} RESOURCE`);
    const description = firstNonBlank(HTMLAttributes.description, href);
    const coverUrl = firstNonBlank(HTMLAttributes.coverUrl);
    const cardChildren: unknown[] = [
      ['span', {}, `${provider} CARD`],
    ];

    if (coverUrl) {
      cardChildren.push(['img', { src: coverUrl, alt: title, loading: 'lazy' }]);
    }

    cardChildren.push(['strong', {}, title]);
    cardChildren.push(['p', {}, description]);

    return [
      'section',
      {
        'data-type': 'embed-video',
        'data-provider': HTMLAttributes.provider,
        'data-url': href,
        'data-video-id': HTMLAttributes.videoId || '',
      },
      [
        'a',
        {
          href,
          rel: 'noreferrer',
          target: '_blank',
        },
        ...cardChildren,
      ],
    ];
  },
});

export const DividerNode = Node.create({
  name: 'divider',
  group: 'block',

  parseHTML() {
    return [{ tag: 'hr[data-type="divider"]' }];
  },

  renderHTML() {
    return ['hr', { 'data-type': 'divider' }];
  },
});
