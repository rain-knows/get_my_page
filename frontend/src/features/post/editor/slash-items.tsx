import { Braces, Heading1, Heading2, Heading3, Image as ImageIcon, Link2, List, ListChecks, ListOrdered, Pilcrow, Quote, SeparatorHorizontal, SquareCode } from 'lucide-react';
import { getUrlFromString, type EditorInstance } from 'novel';
import type { SlashCommandItem, SlashCommandRange } from '@/features/post/editor/types';

interface BuildPostSlashCommandItemsOptions {
  onSelectImage: () => void;
  onInsertEmbed: (params: { editor: EditorInstance; range: SlashCommandRange; inputUrl: string }) => Promise<void>;
  onInsertEmptyEmbedCard: (params: { editor: EditorInstance; range: SlashCommandRange }) => void;
  onInsertEmptyCodeCard: (params: { editor: EditorInstance; range: SlashCommandRange }) => void;
}

/**
 * 功能：弹出外链输入框并标准化链接格式，供 slash 外链卡片命令复用。
 * 关键参数：无。
 * 返回值/副作用：返回规范化链接字符串，取消输入时返回空字符串；副作用为触发浏览器 prompt。
 */
function requestEmbedInputUrl(): string {
  const input = window.prompt('请输入外链地址（支持 GitHub / 音乐 / 视频 / 普通链接）', 'https://');
  if (input === null) {
    return '';
  }

  const normalized = getUrlFromString(input.trim()) ?? input.trim();
  return normalized || '';
}

/**
 * 功能：构建文章编辑器 slash 命令集合，覆盖基础块、图片与外链卡片插入。
 * 关键参数：options 提供图片选择、外链导入、空外链卡片与空代码卡片插入回调。
 * 返回值/副作用：返回 slash 命令数组；无副作用。
 */
export function buildPostSlashCommandItems(options: BuildPostSlashCommandItemsOptions): SlashCommandItem[] {
  return [
    {
      id: 'paragraph',
      title: '正文段落',
      description: '插入普通段落文本块',
      icon: <Pilcrow className="h-4 w-4" />,
      searchTerms: ['text', 'paragraph', '正文'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run();
      },
    },
    {
      id: 'heading-1',
      title: '一级标题',
      description: '插入 H1 标题',
      icon: <Heading1 className="h-4 w-4" />,
      searchTerms: ['h1', 'title'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      id: 'heading-2',
      title: '二级标题',
      description: '插入 H2 标题',
      icon: <Heading2 className="h-4 w-4" />,
      searchTerms: ['h2', 'subtitle'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      id: 'heading-3',
      title: '三级标题',
      description: '插入 H3 标题',
      icon: <Heading3 className="h-4 w-4" />,
      searchTerms: ['h3'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      id: 'bullet-list',
      title: '无序列表',
      description: '插入项目符号列表',
      icon: <List className="h-4 w-4" />,
      searchTerms: ['ul', 'list'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      id: 'ordered-list',
      title: '有序列表',
      description: '插入编号列表',
      icon: <ListOrdered className="h-4 w-4" />,
      searchTerms: ['ol', 'number'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      id: 'task-list',
      title: '任务列表',
      description: '插入可勾选任务清单',
      icon: <ListChecks className="h-4 w-4" />,
      searchTerms: ['todo', 'task', 'checklist'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      id: 'blockquote',
      title: '引用块',
      description: '插入引用段落',
      icon: <Quote className="h-4 w-4" />,
      searchTerms: ['quote', 'blockquote'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      id: 'code-block',
      title: '代码块',
      description: '插入多行代码块',
      icon: <Braces className="h-4 w-4" />,
      searchTerms: ['code', 'snippet'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      id: 'divider',
      title: '分割线',
      description: '插入章节分割线',
      icon: <SeparatorHorizontal className="h-4 w-4" />,
      searchTerms: ['hr', 'divider', 'line'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      id: 'image-upload',
      title: '上传图片',
      description: '打开本地文件并插入图片',
      icon: <ImageIcon className="h-4 w-4" />,
      searchTerms: ['image', 'photo', 'picture'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        options.onSelectImage();
      },
    },
    {
      id: 'embed-card',
      title: '导入外链卡片',
      description: '解析 GitHub/音乐/视频/网页链接并插入卡片',
      icon: <Link2 className="h-4 w-4" />,
      searchTerms: ['embed', 'card', 'link', 'github', 'music', 'video'],
      command: async ({ editor, range }) => {
        const inputUrl = requestEmbedInputUrl();
        if (!inputUrl) {
          return;
        }
        await options.onInsertEmbed({ editor, range, inputUrl });
      },
    },
    {
      id: 'embed-empty-card',
      title: '通用链接占位卡片',
      description: '插入 Notion 风格外链占位卡片，稍后在编辑面板补全链接',
      icon: <Link2 className="h-4 w-4" />,
      searchTerms: ['empty', 'embed', 'link', 'card', 'placeholder', '占位'],
      command: ({ editor, range }) => {
        options.onInsertEmptyEmbedCard({ editor, range });
      },
    },
    {
      id: 'code-empty-card',
      title: '空代码块级组件',
      description: '插入空代码块级组件，稍后在编辑面板补全代码',
      icon: <SquareCode className="h-4 w-4" />,
      searchTerms: ['empty', 'code', 'snippet', 'card', 'placeholder', '占位'],
      command: ({ editor, range }) => {
        options.onInsertEmptyCodeCard({ editor, range });
      },
    },
  ];
}
