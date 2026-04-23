import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface BackendApiResponse {
  code: number;
  message?: string;
  data?: {
    url?: string;
  };
}

/**
 * 功能：解析后端上传接口地址，优先使用 NEXT_PUBLIC_API_URL 并兼容缺省本地开发地址。
 * 关键参数：无。
 * 返回值/副作用：返回后端上传 URL；无副作用。
 */
function resolveBackendUploadUrl(): URL {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  const normalizedBaseUrl = configuredBaseUrl || "http://localhost:8080/api";
  return new URL("files/upload", `${normalizedBaseUrl.replace(/\/+$/, "")}/`);
}

/**
 * 功能：根据请求头构造上传文件名，缺少后缀时自动按 content-type 补全扩展名。
 * 关键参数：requestedName 为客户端文件名；contentType 为 MIME 类型。
 * 返回值/副作用：返回规范化文件名；无副作用。
 */
function resolveFilename(requestedName: string, contentType: string): string {
  const fallbackName = "image";
  const normalizedName = requestedName.trim() || fallbackName;
  const fileExtension = contentType.includes("/") ? `.${contentType.split("/")[1]}` : "";

  if (!fileExtension) {
    return normalizedName;
  }

  return normalizedName.toLowerCase().endsWith(fileExtension.toLowerCase()) ? normalizedName : `${normalizedName}${fileExtension}`;
}

/**
 * 功能：提供 Novel 官方 `/api/upload` 入口并转发到现有后端 MinIO 上传接口。
 * 关键参数：req 为原始上传请求，body 为二进制文件流。
 * 返回值/副作用：返回标准 `{ url }` JSON；副作用为触发后端文件上传。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const requestedName = req.headers.get("x-vercel-filename") || "image";
    const filename = resolveFilename(requestedName, contentType);
    const fileBuffer = await req.arrayBuffer();
    const uploadUrl = resolveBackendUploadUrl();

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: contentType }), filename);

    const response = await fetch(uploadUrl.toString(), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Upload proxy request failed." }, { status: response.status });
    }

    const payload = (await response.json()) as BackendApiResponse;
    const uploadedUrl = payload.data?.url;
    if (payload.code !== 200 || !uploadedUrl) {
      return NextResponse.json({ message: payload.message || "Upload failed." }, { status: 502 });
    }

    return NextResponse.json({ url: uploadedUrl });
  } catch {
    return NextResponse.json({ message: "Upload route internal error." }, { status: 500 });
  }
}
