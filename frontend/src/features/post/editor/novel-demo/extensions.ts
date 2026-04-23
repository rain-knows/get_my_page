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
        imageClass: cx('rounded-lg border border-stone-300 opacity-40'),
      }),
    ];
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx('rounded-lg border border-stone-300'),
  },
});

const updatedImage = UpdatedImage.configure({
  HTMLAttributes: {
    class: cx('rounded-lg border border-stone-300'),
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
    class: cx('my-6 border-t border-stone-300'),
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
      class: cx('border-l-4 border-stone-700'),
    },
  },
  codeBlock: {
    HTMLAttributes: {
      class: cx('rounded-md border border-stone-300 bg-stone-900 p-4 font-mono text-sm text-stone-100'),
    },
  },
  code: {
    HTMLAttributes: {
      class: cx('rounded-md bg-stone-200 px-1.5 py-1 font-mono text-sm'),
      spellcheck: 'false',
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: '#60a5fa',
    width: 4,
  },
  gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
  lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx('rounded-lg border border-stone-300'),
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
    class: cx('cursor-pointer rounded p-1 text-stone-900 hover:bg-stone-100'),
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
      placeholder: 'Press "/" for commands',
    }),
    tiptapLink,
    tiptapImage,
    updatedImage,
    taskList,
    taskItem,
    horizontalRule,
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
