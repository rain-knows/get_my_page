import { createImageUpload, type UploadFn } from 'novel';
import { normalizeStorageAssetUrl } from '@/features/post/editor/novel-demo/asset-url';

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPE_PREFIX = 'image/';

/**
 * 功能：校验图片文件类型与大小，避免不支持格式或超大文件进入上传链路。
 * 关键参数：file 为待上传图片。
 * 返回值/副作用：无返回值；校验失败时抛出 Error。
 */
function validateUploadFile(file: File): void {
  if (!file.type.includes(ACCEPTED_IMAGE_TYPE_PREFIX)) {
    throw new Error('File type not supported.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('File size too big (max 20MB).');
  }
}

/**
 * 功能：调用官方 `/api/upload` 上传入口并预加载图片，保证插入节点时图片可立即渲染。
 * 关键参数：file 为待上传图片文件。
 * 返回值/副作用：返回 Promise<string> 图片 URL；副作用为触发网络请求与图片预加载。
 */
async function onUpload(file: File): Promise<string> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-vercel-filename': file.name || 'image.png',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Error uploading image. Please try again.');
  }

  const payload = (await response.json()) as { url?: string };
  const normalizedUrl = normalizeStorageAssetUrl(payload.url ?? '');
  if (!normalizedUrl) {
    throw new Error('Upload response missing image url.');
  }

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.src = normalizedUrl;
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image preload failed.'));
  });

  return normalizedUrl;
}

/**
 * 功能：导出官方 createImageUpload 生成的上传函数，统一服务于 slash/拖拽/粘贴图片入口。
 * 关键参数：无。
 * 返回值/副作用：返回 UploadFn；副作用为触发上传链路。
 */
export const uploadFn: UploadFn = createImageUpload({
  validateFn: (file) => {
    validateUploadFile(file);
  },
  onUpload,
});
