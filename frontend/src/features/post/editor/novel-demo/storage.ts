import type { JSONContent } from "novel";

const STORAGE_SCOPE = "gmp-novel-demo";
const JSON_FIELD = "novel-content";
const TITLE_FIELD = "title";

interface StoredDocumentShape {
  type?: unknown;
  content?: unknown;
}

/**
 * 功能：按文章 slug 与字段名生成 Novel demo 本地草稿存储键，避免不同文章互相污染。
 * 关键参数：slug 为文章唯一标识；field 为草稿字段名。
 * 返回值/副作用：返回 localStorage 键字符串；无副作用。
 */
export function buildNovelStorageKey(slug: string, field: string): string {
  return `${STORAGE_SCOPE}:${slug}:${field}`;
}

/**
 * 功能：校验并解析本地草稿 JSON 字符串，确保符合 tiptap doc 顶层结构。
 * 关键参数：rawValue 为 localStorage 中的 JSON 字符串。
 * 返回值/副作用：返回合法 JSON 文档或 null；无副作用。
 */
function parseStoredDocument(rawValue: string | null): JSONContent | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const document = parsed as StoredDocumentShape;
    if (document.type !== "doc" || !Array.isArray(document.content)) {
      return null;
    }

    return parsed as JSONContent;
  } catch {
    return null;
  }
}

/**
 * 功能：读取指定文章的本地草稿正文，供编辑页初始化与阅读页本地预览复用。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回合法 JSON 文档对象或 null；副作用为读取 localStorage。
 */
export function loadNovelDraftDocument(slug: string): JSONContent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(buildNovelStorageKey(slug, JSON_FIELD));
  return parseStoredDocument(rawValue);
}

/**
 * 功能：读取指定文章的本地草稿正文 JSON 字符串，供阅读页直接复用渲染协议。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回可渲染正文 JSON 字符串或 null；副作用为读取 localStorage。
 */
export function loadNovelDraftContentString(slug: string): string | null {
  const document = loadNovelDraftDocument(slug);
  return document ? JSON.stringify(document) : null;
}

/**
 * 功能：读取指定文章的本地草稿标题，空值会被标准化为 null。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回标题字符串或 null；副作用为读取 localStorage。
 */
export function loadNovelDraftTitle(slug: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawTitle = window.localStorage.getItem(buildNovelStorageKey(slug, TITLE_FIELD));
  const normalized = (rawTitle ?? "").trim();
  return normalized ? normalized : null;
}

/**
 * 功能：写入指定文章的本地草稿标题，标题为空时自动清理旧值。
 * 关键参数：slug 为文章唯一标识；title 为当前标题草稿。
 * 返回值/副作用：无返回值；副作用为写入或删除 localStorage 键。
 */
export function saveNovelDraftTitle(slug: string, title: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = title.trim();
  const key = buildNovelStorageKey(slug, TITLE_FIELD);
  if (!normalized) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, normalized);
}

/**
 * 功能：清除指定 slug 对应的全部本地草稿数据（标题 + 正文 3 种格式），供发布成功后清理使用。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：无返回值；副作用为删除 localStorage 中的多个草稿键。
 */
export function clearNovelDraftStorage(slug: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const keysToClear = [
    buildNovelStorageKey(slug, TITLE_FIELD),
    buildNovelStorageKey(slug, JSON_FIELD),
    buildNovelStorageKey(slug, "html-content"),
    buildNovelStorageKey(slug, "markdown"),
  ];

  for (const key of keysToClear) {
    window.localStorage.removeItem(key);
  }
}

