import {
  CheckSquare,
  Code,
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
    alert('Please enter a correct Youtube Video Link');
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
    alert('Please enter a correct Twitter Link');
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
    title: 'Text',
    description: 'Just start typing with plain text.',
    searchTerms: ['p', 'paragraph'],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
  },
  {
    title: 'To-do List',
    description: 'Track tasks with a to-do list.',
    searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    searchTerms: ['title', 'big', 'large'],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    searchTerms: ['subtitle', 'medium'],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    searchTerms: ['subtitle', 'small'],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    searchTerms: ['unordered', 'point'],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    searchTerms: ['ordered'],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    searchTerms: ['blockquote'],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run();
    },
  },
  {
    title: 'Code',
    description: 'Capture a code snippet.',
    searchTerms: ['codeblock'],
    icon: <Video size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Image',
    description: 'Upload an image from your computer.',
    searchTerms: ['photo', 'picture', 'media'],
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
    title: 'Youtube',
    description: 'Embed a Youtube video.',
    searchTerms: ['video', 'youtube', 'embed'],
    icon: <Code size={18} />,
    command: ({ editor, range }) => {
      const youtubeUrl = normalizeYoutubeUrl(prompt('Please enter Youtube Video Link'));
      if (!youtubeUrl) {
        return;
      }
      editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: youtubeUrl }).run();
    },
  },
  {
    title: 'Twitter',
    description: 'Embed a Tweet.',
    searchTerms: ['twitter', 'embed'],
    icon: <MessageCircle size={18} />,
    command: ({ editor, range }) => {
      const tweetUrl = normalizeTweetUrl(prompt('Please enter Twitter Link'));
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
