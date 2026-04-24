import { createImageUpload, type UploadFn } from 'novel';
import { normalizeStorageAssetUrl } from '@/features/post/editor/novel-demo/asset-url';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPE_PREFIX = 'image/';
const IMAGE_FILE_EXTENSION_PATTERN = /\.(apng|avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;

export type UploadKind = 'image' | 'file';

type UploadErrorType =
  | 'auth_failed'
  | 'unsupported_type'
  | 'backend_response_error'
  | 'network_error'
  | 'invalid_response'
  | 'unknown';

interface UploadProxyPayload {
  url?: string;
  errorType?: string;
  message?: string;
  backendCode?: number;
  backendStatus?: number;
  backendMessage?: string;
}

export interface UploadAssetResult {
  url: string;
  uploadKind: UploadKind;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

/**
 * 功能：封装上传失败语义，携带可区分的错误类型与后端上下文，便于界面做精准提示。
 * 关键参数：type 为错误分类；message 为对用户展示的文案；detail 为后端排查信息（可选）。
 * 返回值/副作用：返回 UploadError 实例；无副作用。
 */
export class UploadError extends Error {
  readonly type: UploadErrorType;
  readonly detail?: string;

  constructor(type: UploadErrorType, message: string, detail?: string) {
    super(message);
    this.name = 'UploadError';
    this.type = type;
    this.detail = detail;
  }
}

/**
 * 功能：将后端返回的错误类型字符串归一化为前端可识别枚举，避免未知值污染分支判断。
 * 关键参数：rawType 为后端响应中的 errorType 字段。
 * 返回值/副作用：返回标准化 UploadErrorType；无副作用。
 */
function normalizeUploadErrorType(rawType?: string): UploadErrorType {
  if (rawType === 'auth_failed') {
    return 'auth_failed';
  }
  if (rawType === 'unsupported_type') {
    return 'unsupported_type';
  }
  if (rawType === 'backend_response_error') {
    return 'backend_response_error';
  }
  if (rawType === 'network_error') {
    return 'network_error';
  }
  if (rawType === 'invalid_response') {
    return 'invalid_response';
  }
  return 'unknown';
}

/**
 * 功能：读取浏览器当前登录态 accessToken，用于上传请求补发 Authorization 头。
 * 关键参数：无。
 * 返回值/副作用：返回 token 字符串；无副作用。
 */
function readAccessToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (window.localStorage.getItem('accessToken') ?? '').trim();
}

/**
 * 功能：判断文件是否可视为图片，兼容部分剪贴板场景缺失 MIME 但扩展名可识别的情况。
 * 关键参数：file 为待判断文件对象。
 * 返回值/副作用：返回是否满足图片识别条件；无副作用。
 */
function isImageLikeFile(file: File): boolean {
  if (file.type.includes(ACCEPTED_IMAGE_TYPE_PREFIX)) {
    return true;
  }
  return IMAGE_FILE_EXTENSION_PATTERN.test(file.name || '');
}

/**
 * 功能：校验上传文件类型与大小，区分图片上传链路与通用文件上传链路。
 * 关键参数：file 为待上传文件；uploadKind 为上传类型（`image` 或 `file`）。
 * 返回值/副作用：无返回值；校验失败时抛出 Error。
 */
function validateUploadFile(file: File, uploadKind: UploadKind): void {
  if (uploadKind === 'image' && !isImageLikeFile(file)) {
    throw new UploadError('unsupported_type', '上传失败：仅支持图片格式（JPEG/PNG/WebP/GIF/AVIF/HEIC/HEIF）。');
  }

  if (uploadKind === 'image' && file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new UploadError('unsupported_type', '上传失败：图片大小不能超过 8MB。');
  }

  if (uploadKind === 'file' && file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadError('unsupported_type', '上传失败：文件大小不能超过 20MB。');
  }
}

/**
 * 功能：安全解析上传代理返回体，兼容 JSON 解析失败场景。
 * 关键参数：response 为上传代理响应对象。
 * 返回值/副作用：返回解析后的 payload；无副作用。
 */
async function parseUploadProxyPayload(response: Response): Promise<UploadProxyPayload> {
  try {
    const payload = (await response.json()) as UploadProxyPayload;
    return payload ?? {};
  } catch {
    return {};
  }
}

/**
 * 功能：根据上传代理响应构建可定位错误对象，区分鉴权、类型和后端异常。
 * 关键参数：response 为上传代理响应；payload 为解析后的响应体。
 * 返回值/副作用：返回 UploadError；无副作用。
 */
function buildUploadErrorFromResponse(response: Response, payload: UploadProxyPayload): UploadError {
  const normalizedType = normalizeUploadErrorType(payload.errorType);
  const fallbackMessage =
    normalizedType === 'auth_failed'
      ? '上传失败：登录状态已失效，请重新登录后重试。'
      : normalizedType === 'unsupported_type'
        ? '上传失败：文件类型或大小不符合要求。'
        : '上传失败：后端服务响应异常，请稍后重试。';

  const resolvedMessage = payload.message?.trim() || fallbackMessage;
  const detailParts = [
    typeof payload.backendStatus === 'number' ? `status=${payload.backendStatus}` : '',
    typeof payload.backendCode === 'number' ? `code=${payload.backendCode}` : '',
    payload.backendMessage?.trim() ?? '',
  ].filter(Boolean);

  return new UploadError(normalizedType, resolvedMessage, detailParts.join(' | ') || undefined);
}

/**
 * 功能：调用 `/api/upload` 并返回上传结果，统一处理认证头注入与错误分类。
 * 关键参数：file 为待上传文件；uploadKind 为上传类型（图片或通用文件）。
 * 返回值/副作用：返回上传结果对象；副作用为触发网络请求。
 */
export async function uploadAssetFile(file: File, uploadKind: UploadKind = 'image'): Promise<UploadAssetResult> {
  validateUploadFile(file, uploadKind);

  const accessToken = readAccessToken();
  const headers: Record<string, string> = {
    'content-type': file.type || 'application/octet-stream',
    'x-vercel-filename': file.name || 'image.png',
    'x-upload-kind': uploadKind,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: file,
    });
  } catch {
    throw new UploadError('network_error', '上传失败：网络异常，请检查连接后重试。');
  }

  const payload = await parseUploadProxyPayload(response);
  if (!response.ok) {
    throw buildUploadErrorFromResponse(response, payload);
  }

  const normalizedUrl = normalizeStorageAssetUrl(payload.url ?? '');
  if (!normalizedUrl) {
    throw new UploadError('invalid_response', '上传失败：后端响应缺少可用文件地址。');
  }

  return {
    url: normalizedUrl,
    uploadKind,
    mimeType: file.type || 'application/octet-stream',
    fileName: file.name || 'image.png',
    fileSize: file.size,
  };
}

/**
 * 功能：预加载上传后的图片资源，避免插入节点后出现明显闪烁。
 * 关键参数：imageUrl 为已上传图片地址。
 * 返回值/副作用：返回 Promise<void>；副作用为触发图片加载请求。
 */
async function preloadImage(imageUrl: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image preload failed.'));
  });
}

/**
 * 功能：将上传异常统一映射为可读中文提示，供编辑器面板或弹窗直接复用。
 * 关键参数：error 为任意异常对象。
 * 返回值/副作用：返回用户提示文本；无副作用。
 */
export function resolveUploadErrorMessage(error: unknown): string {
  if (error instanceof UploadError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return '上传失败：未知异常，请稍后重试。';
}

/**
 * 功能：调用官方 `/api/upload` 上传入口并预加载图片，保证插入节点时图片可立即渲染。
 * 关键参数：file 为待上传图片文件。
 * 返回值/副作用：返回 Promise<string> 图片 URL；副作用为触发网络请求与图片预加载。
 */
async function onUpload(file: File): Promise<string> {
  const uploaded = await uploadAssetFile(file, 'image');
  await preloadImage(uploaded.url);

  return uploaded.url;
}

/**
 * 功能：导出官方 createImageUpload 生成的上传函数，统一服务于 slash/拖拽/粘贴图片入口。
 * 关键参数：无。
 * 返回值/副作用：返回 UploadFn；副作用为触发上传链路。
 */
export const uploadFn: UploadFn = createImageUpload({
  validateFn: (file) => {
    validateUploadFile(file, 'image');
  },
  onUpload,
});
