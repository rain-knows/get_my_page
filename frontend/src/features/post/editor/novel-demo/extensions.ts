import { cx } from 'class-variance-authority';
import { common, createLowlight } from 'lowlight';
import {
  AIHighlight,
  CharacterCount,
  CodeBlockLowlight,
  Color,
  CustomKeymap,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  Mathematics,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Twitter,
  UpdatedImage,
  UploadImagesPlugin,
  Youtube,
} from 'novel';
import { embedLinkExtension } from '@/features/post/editor/novel-demo/embed-link-extension';

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx('text-(--gmp-novel-link) underline underline-offset-4 transition-colors hover:text-(--gmp-novel-link-hover)'),
  },
});

const tiptapImage = TiptapImage.extend({
  /**
   * 功能：在图片节点插入阶段添加上传占位插件，保持与官方 demo 相同的上传中视觉反馈。
   * 关键参数：无（由扩展生命周期自动调用）。
   * 返回值/副作用：返回 ProseMirror 插件数组；无额外副作用。
   */
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: cx('border border-(--gmp-novel-line) opacity-40'),
      }),
    ];
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx('border border-(--gmp-novel-line)'),
  },
});

const updatedImage = UpdatedImage.configure({
  HTMLAttributes: {
    class: cx('border border-(--gmp-novel-line)'),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx('not-prose pl-2'),
  },
});

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx('my-4 flex items-start gap-2'),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx('my-6 border-t border-(--gmp-novel-line)'),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx('list-outside list-disc leading-3 -mt-2'),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx('list-outside list-decimal leading-3 -mt-2'),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx('leading-normal -mb-2'),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx('border-l-4 border-(--gmp-novel-line-strong)'),
    },
  },
  codeBlock: {
    HTMLAttributes: {
      class: cx('border border-(--gmp-novel-line-strong) bg-(--gmp-novel-code-bg) p-4 font-mono text-sm text-(--gmp-novel-code-text)'),
    },
  },
  code: {
    HTMLAttributes: {
      class: cx('bg-(--gmp-novel-code-inline-bg) px-1.5 py-1 font-mono text-sm text-(--gmp-novel-code-inline-text)'),
      spellcheck: 'false',
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: '#FFCC00',
    width: 3,
  },
  gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
  lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx('border border-(--gmp-novel-line)'),
  },
  inline: false,
});

const twitter = Twitter.configure({
  HTMLAttributes: {
    class: cx('not-prose'),
  },
  inline: false,
});

const mathematics = Mathematics.configure({
  HTMLAttributes: {
    class: cx('cursor-pointer p-1 text-(--gmp-novel-text) hover:bg-(--gmp-novel-toolbar-hover)'),
  },
  katexOptions: {
    throwOnError: false,
  },
});

const characterCount = CharacterCount.configure();

/**
 * 功能：导出 Novel 官方 demo 基线扩展集合，供编辑态与阅读态共享。
 * 关键参数：无。
 * 返回值/副作用：返回默认扩展数组；无副作用。
 */
export function buildNovelBaseExtensions(): unknown[] {
  return [
    starterKit,
    Placeholder.configure({
      placeholder: '输入“/”打开中文命令菜单',
    }),
    tiptapLink,
    tiptapImage,
    updatedImage,
    taskList,
    taskItem,
    horizontalRule,
    embedLinkExtension,
    AIHighlight,
    codeBlockLowlight,
    youtube,
    twitter,
    mathematics,
    characterCount,
    TiptapUnderline,
    HighlightExtension,
    TextStyle,
    Color,
    CustomKeymap,
    GlobalDragHandle,
  ];
}

/**
 * 功能：构建编辑态扩展集合（与阅读态共享基线，调用方可按需附加 Slash 命令扩展）。
 * 关键参数：无。
 * 返回值/副作用：返回编辑扩展数组；无副作用。
 */
export function buildNovelEditorExtensions(): unknown[] {
  return buildNovelBaseExtensions();
}

/**
 * 功能：构建阅读态扩展集合，确保阅读页可解析官方 demo 的节点与标记。
 * 关键参数：无。
 * 返回值/副作用：返回阅读扩展数组；无副作用。
 */
export function buildNovelRendererExtensions(): unknown[] {
  return buildNovelBaseExtensions();
}
