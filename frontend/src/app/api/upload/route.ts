import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface BackendApiResponse {
  code: number;
  message?: string;
  data?: {
    url?: string;
  };
}

type UploadProxyErrorType =
  | 'auth_failed'
  | 'unsupported_type'
  | 'backend_response_error'
  | 'invalid_response'
  | 'network_error';

interface BackendUploadAttemptResult {
  response: Response;
  payload: BackendApiResponse | null;
  rawText: string;
  backendUploadUrl: string;
}

/**
 * 功能：标准化后端 API 基地址，兼容绝对地址和以 `/` 开头的相对地址。
 * 关键参数：inputBaseUrl 为原始配置地址；requestOrigin 为当前请求源地址。
 * 返回值/副作用：返回可用于构造 URL 的规范化基址；无副作用。
 */
function normalizeApiBaseUrl(inputBaseUrl: string, requestOrigin: string): string {
  const normalizedInput = inputBaseUrl.trim();
  if (!normalizedInput) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedInput)) {
    return normalizedInput.replace(/\/+$/, '');
  }

  if (normalizedInput.startsWith('/')) {
    return new URL(normalizedInput, requestOrigin).toString().replace(/\/+$/, '');
  }

  return '';
}

/**
 * 功能：生成上传代理可尝试的后端 API 基地址列表，兼容容器内访问与本地直连场景。
 * 关键参数：requestOrigin 为当前请求源，用于解析相对 API 地址。
 * 返回值/副作用：返回去重后的候选 API 基址数组；无副作用。
 */
function resolveBackendApiBaseCandidates(requestOrigin: string): string[] {
  const configuredInternalBaseUrl = (process.env.BACKEND_INTERNAL_API_URL ?? process.env.INTERNAL_API_URL ?? '').trim();
  const configuredPublicBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  const normalizedPublicBase = normalizeApiBaseUrl(configuredPublicBaseUrl, requestOrigin);

  const candidates = [
    normalizeApiBaseUrl(configuredInternalBaseUrl, requestOrigin),
    normalizedPublicBase,
  ];

  try {
    if (normalizedPublicBase) {
      const parsedPublicBase = new URL(normalizedPublicBase);
      const isLoopbackHost =
        parsedPublicBase.hostname === 'localhost' ||
        parsedPublicBase.hostname === '127.0.0.1' ||
        parsedPublicBase.hostname === '0.0.0.0';

      if (isLoopbackHost) {
        const normalizedPath = parsedPublicBase.pathname.replace(/\/+$/, '') || '/api';
        candidates.push(`${parsedPublicBase.protocol}//backend:8080${normalizedPath}`);
      }
    }
  } catch {
    // ignore malformed configured base URL and fallback to defaults below.
  }

  candidates.push('http://backend:8080/api', 'http://localhost:8080/api');

  const deduplicated = new Set<string>();
  candidates.forEach((baseUrl) => {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    if (normalizedBase) {
      deduplicated.add(normalizedBase);
    }
  });

  return Array.from(deduplicated);
}

/**
 * 功能：由后端 API 基地址构造文件上传接口地址。
 * 关键参数：apiBaseUrl 为后端 API 基地址（例如 `http://backend:8080/api`）。
 * 返回值/副作用：返回后端上传 URL；无副作用。
 */
function buildBackendUploadUrl(apiBaseUrl: string): URL {
  return new URL('files/upload', `${apiBaseUrl.replace(/\/+$/, '')}/`);
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
  if (errorType === 'network_error') {
    return '上传失败：上传代理无法连接后端服务，请检查后端或容器网络。';
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
  backendTarget?: string,
): Response {
  const backendMessage = backendPayload?.message?.trim() || backendRaw.trim();
  return NextResponse.json(
    {
      errorType,
      message: resolveProxyErrorMessage(errorType, backendMessage),
      backendStatus: status,
      backendCode: typeof backendPayload?.code === 'number' ? backendPayload.code : undefined,
      backendMessage: backendMessage || undefined,
      backendTarget,
    },
    { status },
  );
}

/**
 * 功能：尝试向单个后端地址转发上传请求并返回解析后的响应体，统一封装网络异常。
 * 关键参数：backendUploadUrl 为后端上传接口地址；headers 为透传请求头；formData 为上传表单。
 * 返回值/副作用：返回后端响应快照；副作用为触发网络请求。
 */
async function requestBackendUpload(
  backendUploadUrl: URL,
  headers: HeadersInit,
  formData: FormData,
): Promise<BackendUploadAttemptResult> {
  const response = await fetch(backendUploadUrl.toString(), {
    method: 'POST',
    headers,
    body: formData,
  });
  const { payload, rawText } = await parseBackendResponse(response);
  return {
    response,
    payload,
    rawText,
    backendUploadUrl: backendUploadUrl.toString(),
  };
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
    const requestOrigin = new URL(req.url).origin;
    const backendApiCandidates = resolveBackendApiBaseCandidates(requestOrigin);
    const authorization = resolveAuthorizationHeader(req);

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: contentType }), filename);

    const headers: HeadersInit = {};
    if (authorization) {
      headers.authorization = authorization;
    }

    let lastNetworkError = '';
    let lastAttempt: BackendUploadAttemptResult | null = null;

    for (const apiBaseUrl of backendApiCandidates) {
      const backendUploadUrl = buildBackendUploadUrl(apiBaseUrl);
      try {
        const attempt = await requestBackendUpload(backendUploadUrl, headers, formData);
        lastAttempt = attempt;

        if (!attempt.response.ok) {
          if (attempt.response.status === 404 || attempt.response.status === 405) {
            continue;
          }
          const errorType = resolveErrorType(
            attempt.response.status,
            attempt.payload?.message?.trim() || attempt.rawText.trim(),
          );
          return buildUploadErrorResponse(
            attempt.response.status,
            errorType,
            attempt.payload,
            attempt.rawText,
            attempt.backendUploadUrl,
          );
        }

        const uploadedUrl = attempt.payload?.data?.url;
        if (!attempt.payload || attempt.payload.code !== 200 || !uploadedUrl) {
          continue;
        }

        return NextResponse.json({ url: uploadedUrl });
      } catch (error) {
        if (error instanceof Error) {
          lastNetworkError = error.message;
        } else {
          lastNetworkError = '';
        }
      }
    }

    if (lastAttempt) {
      return buildUploadErrorResponse(502, 'invalid_response', lastAttempt.payload, lastAttempt.rawText, lastAttempt.backendUploadUrl);
    }

    return NextResponse.json(
      {
        errorType: 'network_error',
        message: lastNetworkError
          ? `上传失败：上传代理无法连接后端服务（${lastNetworkError}）。`
          : '上传失败：上传代理无法连接后端服务，请稍后重试。',
      },
      { status: 502 },
    );
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
