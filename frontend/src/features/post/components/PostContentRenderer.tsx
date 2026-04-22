import type { PostContentFormat } from '@/features/post/types';
import { parseBlockDocument } from '@/features/post/editor/block-model';
import { BlockRenderer } from '@/features/post/components/BlockRenderer';

interface PostContentRendererProps {
  content: string;
  contentFormat: PostContentFormat;
}

/**
 * 功能：按 gmp-block-v1 协议渲染文章正文，保障阅读页与编辑预览共用同一块渲染内核。
 * 关键参数：content 为正文 JSON 字符串；contentFormat 为正文格式标识。
 * 返回值/副作用：返回正文渲染节点；无副作用。
 */
export function PostContentRenderer({ content, contentFormat }: PostContentRendererProps) {
  if (contentFormat !== 'gmp-block-v1') {
    return (
      <div className="border border-red-500/40 bg-(--gmp-bg-panel) p-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-red-400">
          CONTENT FORMAT UNSUPPORTED // EXPECTED gmp-block-v1
        </p>
      </div>
    );
  }

  const blockDocument = parseBlockDocument(content);
  if (!blockDocument) {
    return (
      <div className="border border-red-500/40 bg-(--gmp-bg-panel) p-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-red-400">
          BLOCK DOCUMENT PARSE FAILED // PLEASE RUN MIGRATION
        </p>
      </div>
    );
  }

  return <BlockRenderer document={blockDocument} />;
}
