"use client";

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  createImageUpload,
  EditorContent,
  EditorRoot,
  handleImageDrop,
  handleImagePaste,
  Placeholder,
  StarterKit,
  TiptapLink,
  UpdatedImage,
  type EditorInstance,
  type JSONContent,
} from 'novel';
import { ApiError } from '@/lib/api-client';
import { updatePost, uploadPostAsset } from '@/features/post/api';
import {
  buildExcerptFromEditorDoc,
  parsePostContentToEditorDoc,
  serializeEditorDoc,
} from '@/features/post/editor/serializer';
import { EditorEntryTemplate } from '@/features/editor/components';
import { PostContentRenderer } from '@/features/post/components/PostContentRenderer';
import type { PostDetail } from '@/features/post/types';

interface PostRichEditorProps {
  post: PostDetail;
  onSaved: (updatedPost: PostDetail) => void;
  onCancel: () => void;
}

/**
 * 功能：渲染基于 Novel 运行时的文章富文本编辑器，并统一接入保存与上传链路。
 * 关键参数：post 为当前文章详情；onSaved/onCancel 为编辑态回调。
 * 返回值/副作用：返回编辑器 UI；副作用为触发更新接口与上传接口。
 */
export function PostRichEditor({ post, onSaved, onCancel }: PostRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusHint, setStatusHint] = useState('');
  const [previewContent, setPreviewContent] = useState<string>(() => post.content);

  const initialDoc = useMemo(
    () => parsePostContentToEditorDoc(post.content, post.contentFormat),
    [post.content, post.contentFormat],
  );

  const uploadFn = useMemo(
    () => createImageUpload({
      onUpload: async (file) => {
        const uploadResult = await uploadPostAsset(file, post.id);
        return uploadResult.url;
      },
    }),
    [post.id],
  );

  /**
   * 功能：统一处理编辑器内容变更后的状态同步。
   * 关键参数：doc 为当前编辑器 JSON 文档。
   * 返回值/副作用：无返回值；副作用为更新预览内容与提示文案。
   */
  function syncEditorContent(doc: JSONContent): void {
    setPreviewContent(serializeEditorDoc(doc));
    setStatusHint('');
  }

  /**
   * 功能：处理编辑器实例创建事件，缓存实例并同步初始预览。
   * 关键参数：editor 为 Novel 当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新实例与预览状态。
   */
  function handleEditorCreate(editor: EditorInstance): void {
    setEditorInstance(editor);
    syncEditorContent(editor.getJSON() as JSONContent);
  }

  /**
   * 功能：处理图片文件选择并插入编辑器。
   * 关键参数：event 为文件选择事件。
   * 返回值/副作用：无返回值；副作用为触发上传流程并更新提示。
   */
  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file || !editorInstance) {
      return;
    }

    setActionLoading(true);
    setError('');
    setStatusHint('上传图片中...');

    uploadPostAsset(file, post.id)
      .then((uploadResult) => {
        editorInstance.chain().focus().setImage({ src: uploadResult.url, alt: file.name || 'article-image' }).run();
        setStatusHint('图片已插入');
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(`图片上传失败：${err.message}`);
        } else {
          setError('图片上传失败，请稍后重试');
        }
        setStatusHint('');
      })
      .finally(() => {
        setActionLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  }

  /**
   * 功能：将当前编辑器内容保存到后端文章接口。
   * 关键参数：无（内部读取 editor/post）。
   * 返回值/副作用：返回 Promise<void>；副作用为调用更新接口并触发 onSaved。
   */
  async function handleSavePost(): Promise<void> {
    if (!editorInstance) {
      return;
    }

    setSaveLoading(true);
    setError('');
    setStatusHint('保存中...');

    const docJson = editorInstance.getJSON() as JSONContent;
    const nextExcerpt = buildExcerptFromEditorDoc(docJson) || post.excerpt || post.summary || '';

    try {
      const updatedPost = await updatePost(post.id, {
        title: post.title,
        slug: post.slug,
        summary: nextExcerpt,
        excerpt: nextExcerpt,
        content: serializeEditorDoc(docJson),
        contentFormat: 'tiptap-json',
        status: post.status,
        baseUpdatedAt: post.baseUpdatedAt,
        coverUrl: post.coverUrl,
      });

      setStatusHint('保存成功');
      onSaved(updatedPost);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('保存失败，请稍后重试');
      }
      setStatusHint('');
    } finally {
      setSaveLoading(false);
    }
  }

  const actionBar = (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={actionLoading || saveLoading || !editorInstance}
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
      >
        IMAGE
      </button>
      <button
        type="button"
        disabled
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-(--gmp-text-secondary) opacity-60"
        title="AI 功能一期关闭，仅预留扩展点"
      >
        AI (SOON)
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saveLoading}
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
      >
        CANCEL
      </button>
      <button
        type="button"
        onClick={() => void handleSavePost()}
        disabled={saveLoading || actionLoading || !editorInstance}
        className="h-10 border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-xs font-black tracking-widest uppercase text-black hover:opacity-90 disabled:opacity-60"
      >
        {saveLoading ? 'SAVING...' : 'SAVE'}
      </button>
    </div>
  );

  const hiddenInputs = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif,image/heic,image/heif"
      className="hidden"
      onChange={handleFileInputChange}
    />
  );

  const editorArea = (
    <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base)">
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={initialDoc}
          extensions={[
            StarterKit.configure({
              heading: { levels: [1, 2, 3] },
            }),
            TiptapLink.configure({
              openOnClick: false,
              autolink: false,
              linkOnPaste: false,
            }),
            UpdatedImage,
            Placeholder.configure({
              placeholder: '输入正文，支持标题、列表、引用、代码与图片。',
            }),
          ]}
          onCreate={({ editor }) => {
            handleEditorCreate(editor);
          }}
          onUpdate={({ editor }) => {
            syncEditorContent(editor.getJSON() as JSONContent);
          }}
          editorProps={{
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                'gmp-notion-editor min-h-96 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3 md:p-5 font-mono text-sm leading-relaxed text-(--gmp-text-primary) focus:outline-none',
            },
          }}
        />
      </EditorRoot>
    </div>
  );

  const helperTexts = (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-(--gmp-text-secondary)">
        Novel Runtime: 当前编辑器直接运行 npm novel，并以 tiptap-json 作为唯一内容协议。
      </p>
      <p className="font-mono text-xs uppercase tracking-widest text-(--gmp-text-secondary)">
        AI 功能一期关闭，后续仅在此基础上追加扩展能力。
      </p>
    </>
  );

  const previewArea = (
    <section className="space-y-3 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-(--gmp-accent)">LIVE PREVIEW // TIPTAP JSON READER</p>
      <PostContentRenderer content={previewContent} contentFormat="tiptap-json" />
    </section>
  );

  return (
    <EditorEntryTemplate
      modeLabel="ADMIN EDIT MODE"
      title={post.title}
      slug={post.slug}
      actions={actionBar}
      hiddenInputs={hiddenInputs}
      statusHint={statusHint}
      error={error}
      editorArea={editorArea}
      helperTexts={helperTexts}
      previewArea={previewArea}
    />
  );
}
