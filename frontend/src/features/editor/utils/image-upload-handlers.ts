import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

export type EditorImageUploadHandler = (file: File) => Promise<void> | void;

/**
 * 功能：处理编辑区粘贴事件中的图片文件，并委托到业务上传回调。
 * 关键参数：view 为 ProseMirror 视图；event 为粘贴事件；uploadImage 为上传处理函数。
 * 返回值/副作用：返回是否已接管事件；副作用为触发图片上传流程。
 */
export function handleEditorImagePaste(
  view: EditorView,
  event: ClipboardEvent,
  uploadImage: EditorImageUploadHandler,
): boolean {
  if (!event.clipboardData?.files?.length) {
    return false;
  }

  const file = event.clipboardData.files[0];
  if (!file) {
    return false;
  }

  event.preventDefault();
  void uploadImage(file);
  return true;
}

/**
 * 功能：处理编辑区拖拽事件中的图片文件，并在落点处插入后触发上传。
 * 关键参数：view 为 ProseMirror 视图；event 为拖拽事件；moved 表示是否内部拖拽。
 * 返回值/副作用：返回是否已接管事件；副作用为更新选区并触发图片上传。
 */
export function handleEditorImageDrop(
  view: EditorView,
  event: DragEvent,
  moved: boolean,
  uploadImage: EditorImageUploadHandler,
): boolean {
  if (moved || !event.dataTransfer?.files?.length) {
    return false;
  }

  const file = event.dataTransfer.files[0];
  if (!file) {
    return false;
  }

  event.preventDefault();
  const coords = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });
  if (coords) {
    const resolved = view.state.doc.resolve(Math.max(1, coords.pos));
    const transaction = view.state.tr.setSelection(TextSelection.near(resolved));
    view.dispatch(transaction);
  }
  void uploadImage(file);
  return true;
}
