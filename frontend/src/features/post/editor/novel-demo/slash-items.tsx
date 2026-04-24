import {
  CheckSquare,
  Code,
  Globe,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  TextQuote,
} from 'lucide-react';
import { Command, createSuggestionItems, renderItems, type SuggestionItem } from 'novel';
import { insertEmbedCardAtRange } from '@/features/post/editor/novel-demo/embed-link';

/**
 * 功能：导出官方 demo 基线 Slash 命令集合，覆盖文本块与统一链接卡片入口。
 * 关键参数：无。
 * 返回值/副作用：返回 suggestionItems 数组；无副作用。
 */
export const suggestionItems: SuggestionItem[] = createSuggestionItems([
  {
    title: '正文段落',
    description: '插入普通文本段落。',
    searchTerms: ['段落', '文本', 'paragraph', 'text'],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
  },
  {
    title: '待办清单',
    description: '插入可勾选的任务列表。',
    searchTerms: ['待办', '任务', 'todo', 'task', 'check'],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: '一级标题',
    description: '插入最高层级标题。',
    searchTerms: ['标题', 'title', 'h1'],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '二级标题',
    description: '插入中等层级标题。',
    searchTerms: ['标题', 'subtitle', 'h2'],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '三级标题',
    description: '插入较小层级标题。',
    searchTerms: ['标题', 'subtitle', 'h3'],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '无序列表',
    description: '插入项目符号列表。',
    searchTerms: ['列表', 'bullet', 'unordered', 'list'],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '有序列表',
    description: '插入编号列表。',
    searchTerms: ['列表', 'ordered', 'numbered', 'list'],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '引用块',
    description: '插入引用文本块。',
    searchTerms: ['引用', 'quote', 'blockquote'],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run();
    },
  },
  {
    title: '代码块',
    description: '插入代码片段块。',
    searchTerms: ['代码', 'code', 'codeblock'],
    icon: <Code size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: '导入链接卡片',
    description: '插入统一卡片解析器入口，支持链接解析与图片上传卡片。',
    searchTerms: ['链接', '卡片', 'embed', 'link', 'preview', '上传', 'image'],
    icon: <Globe size={18} />,
    command: ({ editor, range }) => {
      insertEmbedCardAtRange(editor, range);
    },
  },
]);

/**
 * 功能：导出 Slash 命令扩展，复用官方 `renderItems` 渲染策略。
 * 关键参数：无。
 * 返回值/副作用：返回 Command 扩展实例；无副作用。
 */
export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
