import type { SlashCommandItem } from '@/features/post/editor/types';

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    type: 'image',
    title: '插入图片',
    alias: 'image',
    description: '上传图片并插入 imageBlock 节点',
  },
  {
    type: 'card',
    title: '智能卡片',
    alias: 'card',
    description: '自动识别链接并插入 github/music/video/link 卡片',
  },
  {
    type: 'divider',
    title: '分割线',
    alias: 'divider',
    description: '插入 divider 节点',
  },
];

/**
 * 功能：根据 Slash 查询词过滤命令列表。
 * 关键参数：query 为用户输入的 `/` 后缀关键字。
 * 返回值/副作用：返回匹配命令数组，无副作用。
 */
export function filterSlashCommands(query: string): SlashCommandItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return SLASH_COMMAND_ITEMS;
  }

  return SLASH_COMMAND_ITEMS.filter((item) => {
    return item.alias.includes(normalized) || item.title.includes(normalized);
  });
}
