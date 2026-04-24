export const CODE_LINE_NUMBERS_STORAGE_KEY = 'gmp:novel:code-line-numbers';

/**
 * 功能：从 localStorage 读取代码块行号展示偏好，供编辑页与阅读页共享开关状态。
 * 关键参数：无。
 * 返回值/副作用：返回是否开启行号；无副作用。
 */
export function readCodeLineNumbersPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(CODE_LINE_NUMBERS_STORAGE_KEY) === 'true';
}

/**
 * 功能：将代码块行号展示偏好写入 localStorage，确保页面刷新后仍能保持用户选择。
 * 关键参数：enabled 表示是否开启行号显示。
 * 返回值/副作用：无返回值；副作用为写入 localStorage。
 */
export function writeCodeLineNumbersPreference(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CODE_LINE_NUMBERS_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * 功能：将代码文本行数转换为用于 CSS `content` 的多行序号字符串。
 * 关键参数：lineCount 为代码块总行数。
 * 返回值/副作用：返回以 `\n` 分隔的行号字符串；无副作用。
 */
function buildLineNumberGutter(lineCount: number): string {
  return Array.from({ length: Math.max(1, lineCount) }, (_, index) => String(index + 1)).join('\n');
}

/**
 * 功能：按代码文本内容计算真实行数，统一兼容 `\r\n` 与末尾换行。
 * 关键参数：rawCodeText 为代码块原始文本内容。
 * 返回值/副作用：返回至少为 1 的行数；无副作用。
 */
function resolveCodeLineCount(rawCodeText: string): number {
  const normalizedText = rawCodeText.replace(/\r\n?/g, '\n');
  const trimmedTrailingNewline = normalizedText.endsWith('\n') ? normalizedText.slice(0, -1) : normalizedText;
  if (!trimmedTrailingNewline) {
    return 1;
  }
  return trimmedTrailingNewline.split('\n').length;
}

/**
 * 功能：为编辑器容器内所有代码块挂载或清理行号属性，供 CSS 行号 gutter 渲染使用。
 * 关键参数：container 为编辑器容器 DOM；enabled 表示是否开启行号。
 * 返回值/副作用：无返回值；副作用为写入 `pre` 节点 data-attributes。
 */
export function applyCodeLineNumberAttributes(container: HTMLElement | null, enabled: boolean): void {
  if (!container) {
    return;
  }

  const preElements = container.querySelectorAll('pre');
  preElements.forEach((preElement) => {
    const codeElement = preElement.querySelector('code');
    if (!enabled || !codeElement) {
      preElement.removeAttribute('data-line-numbers');
      preElement.removeAttribute('data-line-number-gutter');
      return;
    }

    const lineCount = resolveCodeLineCount(codeElement.textContent ?? '');
    preElement.setAttribute('data-line-numbers', 'true');
    preElement.setAttribute('data-line-number-gutter', buildLineNumberGutter(lineCount));
  });
}
