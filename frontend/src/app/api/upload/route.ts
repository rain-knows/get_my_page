import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface BackendApiResponse {
  code: number;
  message?: string;
  data?: {
    url?: string;
  };
}

type UploadProxyErrorType = 'auth_failed' | 'unsupported_type' | 'backend_response_error' | 'invalid_response';

/**
 * 功能：解析后端上传接口地址，优先使用 NEXT_PUBLIC_API_URL 并兼容缺省本地开发地址。
 * 关键参数：无。
 * 返回值/副作用：返回后端上传 URL；无副作用。
 */
function resolveBackendUploadUrl(): URL {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  const normalizedBaseUrl = configuredBaseUrl || 'http://localhost:8080/api';
  return new URL('files/upload', `${normalizedBaseUrl.replace(/\/+$/, '')}/`);
}

/**
 * 功能：根据请求头构造上传文件名，缺少后缀时自动按 content-type 补全扩展名。
 * 关键参数：requestedName 为客户端文件名；contentType 为 MIME 类型。
 * 返回值/副作用：返回规范化文件名；无副作用。
 */
function resolveFilename(requestedName: string, contentType: string): string {
  const fallbackName = 'image';
  const normalizedName = requestedName.trim() || fallbackName;
  const fileExtension = contentType.includes('/') ? `.${contentType.split('/')[1]}` : '';

  if (!fileExtension) {
    return normalizedName;
  }

  return normalizedName.toLowerCase().endsWith(fileExtension.toLowerCase()) ? normalizedName : `${normalizedName}${fileExtension}`;
}

/**
 * 功能：从原始请求中提取 Authorization 头并透传到后端上传接口。
 * 关键参数：request 为 Next 路由收到的上传请求。
 * 返回值/副作用：返回标准 Bearer 字段或空字符串；无副作用。
 */
function resolveAuthorizationHeader(request: Request): string {
  const rawAuthorization = request.headers.get('authorization') ?? '';
  return rawAuthorization.trim();
}

/**
 * 功能：安全解析后端响应体，兼容非 JSON 文本响应，避免代理层因解析异常提前失败。
 * 关键参数：response 为后端上传响应对象。
 * 返回值/副作用：返回结构化 payload 与原始文本；无副作用。
 */
async function parseBackendResponse(response: Response): Promise<{ payload: BackendApiResponse | null; rawText: string }> {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return { payload: null, rawText: '' };
  }

  try {
    return {
      payload: JSON.parse(rawText) as BackendApiResponse,
      rawText,
    };
  } catch {
    return { payload: null, rawText };
  }
}

/**
 * 功能：按后端响应状态与消息推断错误类型，区分鉴权失败、类型不支持与其他后端异常。
 * 关键参数：status 为 HTTP 状态码；backendMessage 为后端返回消息。
 * 返回值/副作用：返回代理错误类型；无副作用。
 */
function resolveErrorType(status: number, backendMessage: string): UploadProxyErrorType {
  if (status === 401 || status === 403) {
    return 'auth_failed';
  }

  if (
    status === 400 &&
    /(不支持的文件类型|文件大小不能超过|上传文件不能为空|file type|size|unsupported)/i.test(backendMessage)
  ) {
    return 'unsupported_type';
  }

  return 'backend_response_error';
}

/**
 * 功能：根据错误类型生成可排查的上传失败提示，便于前端精确反馈用户。
 * 关键参数：errorType 为代理错误分类；backendMessage 为后端消息。
 * 返回值/副作用：返回用户提示文案；无副作用。
 */
function resolveProxyErrorMessage(errorType: UploadProxyErrorType, backendMessage: string): string {
  if (errorType === 'auth_failed') {
    return '上传失败：鉴权失败或登录状态已过期，请重新登录后重试。';
  }
  if (errorType === 'unsupported_type') {
    return backendMessage || '上传失败：文件类型不支持或超过大小限制。';
  }
  if (errorType === 'invalid_response') {
    return '上传失败：后端返回数据异常，未提供可用文件地址。';
  }
  return backendMessage || '上传失败：后端服务响应异常，请稍后重试。';
}

/**
 * 功能：构造结构化上传失败响应，统一返回 errorType 与后端上下文字段供前端分类提示。
 * 关键参数：status 为响应状态码；errorType 为错误分类；backendPayload 为后端响应体；backendRaw 为后端原始文本。
 * 返回值/副作用：返回 NextResponse JSON；无副作用。
 */
function buildUploadErrorResponse(
  status: number,
  errorType: UploadProxyErrorType,
  backendPayload: BackendApiResponse | null,
  backendRaw: string,
): Response {
  const backendMessage = backendPayload?.message?.trim() || backendRaw.trim();
  return NextResponse.json(
    {
      errorType,
      message: resolveProxyErrorMessage(errorType, backendMessage),
      backendStatus: status,
      backendCode: typeof backendPayload?.code === 'number' ? backendPayload.code : undefined,
      backendMessage: backendMessage || undefined,
    },
    { status },
  );
}

/**
 * 功能：提供 Novel 官方 `/api/upload` 入口并转发到现有后端 MinIO 上传接口。
 * 关键参数：req 为原始上传请求，body 为二进制文件流。
 * 返回值/副作用：返回标准 `{ url }` JSON；副作用为触发后端文件上传。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const requestedName = req.headers.get('x-vercel-filename') || 'image';
    const filename = resolveFilename(requestedName, contentType);
    const fileBuffer = await req.arrayBuffer();
    const uploadUrl = resolveBackendUploadUrl();
    const authorization = resolveAuthorizationHeader(req);

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: contentType }), filename);

    const headers: HeadersInit = {};
    if (authorization) {
      headers.authorization = authorization;
    }

    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers,
      body: formData,
    });

    const { payload, rawText } = await parseBackendResponse(response);
    if (!response.ok) {
      const errorType = resolveErrorType(response.status, payload?.message?.trim() || rawText.trim());
      return buildUploadErrorResponse(response.status, errorType, payload, rawText);
    }

    const uploadedUrl = payload?.data?.url;
    if (!payload || payload.code !== 200 || !uploadedUrl) {
      return buildUploadErrorResponse(502, 'invalid_response', payload, rawText);
    }

    return NextResponse.json({ url: uploadedUrl });
  } catch {
    return NextResponse.json(
      {
        errorType: 'backend_response_error',
        message: '上传失败：上传代理内部异常，请稍后重试。',
      },
      { status: 500 },
    );
  }
}
