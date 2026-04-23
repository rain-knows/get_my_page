import type { EditorInstance } from 'novel';
import type { EmbedResolveResult } from '@/features/post/types';
import type { EmbedInsertPayload, EmbedNodeType, SlashCommandRange } from '@/features/post/editor/types';

const EMBED_TYPE_MAP: Record<string, EmbedNodeType> = {
  github: 'embedGithub',
  music: 'embedMusic',
  video: 'embedVideo',
  link: 'embedLink',
};

/**
 * 功能：从 embed 快照中按 key 安全提取字符串字段，统一处理空值与非字符串场景。
 * 关键参数：snapshot 为后端快照；key 为目标字段名。
 * 返回值/副作用：返回字段字符串，缺失时返回空字符串；无副作用。
 */
function readSnapshotString(snapshot: Record<string, unknown> | null, key: string): string {
  if (!snapshot) {
    return '';
  }
  const value = snapshot[key];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 功能：将后端 embed 解析结果转换为编辑器可插入的节点载荷。
 * 关键参数：resolved 为解析响应；rawInput 为用户原始输入链接。
 * 返回值/副作用：返回插入节点 payload；无副作用。
 */
export function buildEmbedInsertPayload(resolved: EmbedResolveResult, rawInput: string): EmbedInsertPayload {
  const nodeType = EMBED_TYPE_MAP[resolved.cardType] ?? 'embedLink';
  const snapshot = resolved.snapshot;
  const url = resolved.normalizedUrl || resolved.fallbackUrl || rawInput.trim();

  return {
    type: nodeType,
    attrs: {
      provider: resolved.provider || 'unknown',
      url,
      fallbackUrl: resolved.fallbackUrl || url,
      resolved: Boolean(resolved.resolved),
      title: readSnapshotString(snapshot, 'title') || readSnapshotString(snapshot, 'name') || url,
      description: readSnapshotString(snapshot, 'description'),
      coverUrl: readSnapshotString(snapshot, 'coverUrl') || readSnapshotString(snapshot, 'avatarUrl'),
      domain: readSnapshotString(snapshot, 'domain'),
      siteName: readSnapshotString(snapshot, 'siteName'),
      artist: readSnapshotString(snapshot, 'artist'),
      videoId: readSnapshotString(snapshot, 'videoId'),
      snapshot,
    },
  };
}

/**
 * 功能：在当前选区插入 embed 卡片节点，并删除 slash 命令触发范围。
 * 关键参数：editor 为当前编辑器实例；range 为 slash 触发区间；payload 为节点载荷。
 * 返回值/副作用：无返回值；副作用为修改编辑器文档。
 */
export function insertEmbedCardNode(editor: EditorInstance, range: SlashCommandRange, payload: EmbedInsertPayload): void {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent([
      {
        type: payload.type,
        attrs: payload.attrs,
      },
      {
        type: 'paragraph',
      },
    ])
    .run();
}

/**
 * 功能：在 embed 解析失败时插入普通链接段落，作为非阻断降级兜底。
 * 关键参数：editor 为当前编辑器实例；range 为 slash 触发区间；inputUrl 为用户输入链接。
 * 返回值/副作用：无返回值；副作用为修改编辑器文档。
 */
export function insertFallbackLinkNode(editor: EditorInstance, range: SlashCommandRange, inputUrl: string): void {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return;
  }

  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: href,
            marks: [
              {
                type: 'link',
                attrs: {
                  href,
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
      },
    ])
    .run();
}
