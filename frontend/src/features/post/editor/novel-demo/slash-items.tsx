import {
  CheckSquare,
  Code,
  Globe,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  MessageCircle,
  Text,
  TextQuote,
  Video,
} from 'lucide-react';
import { Command, createSuggestionItems, renderItems, type SuggestionItem } from 'novel';
import { insertEmbedCardAtRange } from '@/features/post/editor/novel-demo/embed-link';
import { uploadFn } from '@/features/post/editor/novel-demo/upload';

const YOUTUBE_REGEX =
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
const TWITTER_REGEX = /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]{1,15})(\/status\/(\d+))?(\/\S*)?$/;

/**
 * 功能：通过弹窗获取 Youtube 链接并插入编辑器节点，校验失败时给出明确提示。
 * 关键参数：inputValue 为用户输入的原始链接文本。
 * 返回值/副作用：返回合法链接或 null；副作用为弹出浏览器提示框。
 */
function normalizeYoutubeUrl(inputValue: string | null): string | null {
  const normalized = (inputValue ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (!YOUTUBE_REGEX.test(normalized)) {
    alert('请输入有效的 Youtube 视频链接。');
    return null;
  }

  return normalized;
}

/**
 * 功能：通过弹窗获取 Twitter/X 链接并插入编辑器节点，校验失败时提示重试。
 * 关键参数：inputValue 为用户输入的原始链接文本。
 * 返回值/副作用：返回合法链接或 null；副作用为弹出浏览器提示框。
 */
function normalizeTweetUrl(inputValue: string | null): string | null {
  const normalized = (inputValue ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (!TWITTER_REGEX.test(normalized)) {
    alert('请输入有效的 Twitter/X 链接。');
    return null;
  }

  return normalized;
}

/**
 * 功能：导出官方 demo 基线 Slash 命令集合，覆盖文本块、媒体、Youtube 与 Twitter。
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
    description: '插入通用链接占位卡片，可自动识别并生成预览。',
    searchTerms: ['链接', '卡片', 'embed', 'link', 'preview'],
    icon: <Globe size={18} />,
    command: ({ editor, range }) => {
      insertEmbedCardAtRange(editor, range);
    },
  },
  {
    title: '图片上传',
    description: '从本地上传图片到编辑器。',
    searchTerms: ['图片', '图像', 'photo', 'picture', 'media'],
    icon: <ImageIcon size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.item(0);
        if (!file) {
          return;
        }
        const position = editor.view.state.selection.from;
        uploadFn(file, editor.view, position);
      };
      input.click();
    },
  },
  {
    title: 'Youtube 视频',
    description: '嵌入 Youtube 视频。',
    searchTerms: ['视频', 'youtube', 'embed'],
    icon: <Video size={18} />,
    command: ({ editor, range }) => {
      const youtubeUrl = normalizeYoutubeUrl(prompt('请输入 Youtube 视频链接'));
      if (!youtubeUrl) {
        return;
      }
      editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: youtubeUrl }).run();
    },
  },
  {
    title: 'Twitter 推文',
    description: '嵌入 Twitter/X 推文。',
    searchTerms: ['推文', 'twitter', 'x', 'embed'],
    icon: <MessageCircle size={18} />,
    command: ({ editor, range }) => {
      const tweetUrl = normalizeTweetUrl(prompt('请输入 Twitter/X 链接'));
      if (!tweetUrl) {
        return;
      }
      editor.chain().focus().deleteRange(range).setTweet({ src: tweetUrl }).run();
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
