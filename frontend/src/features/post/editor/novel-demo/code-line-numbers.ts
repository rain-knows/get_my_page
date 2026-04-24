/**
 * 功能：将代码文本行数转换为用于 CSS `content` 的多行序号字符串。
 * 关键参数：lineCount 为代码块总行数。
 * 返回值/副作用：返回以 `\n` 分隔的行号字符串；无副作用。
 */
export function buildCodeLineNumberGutter(lineCount: number): string {
  return Array.from({ length: Math.max(1, lineCount) }, (_, index) => String(index + 1)).join('\n');
}

/**
 * 功能：按代码文本内容计算真实行数，统一兼容 `\r\n` 与末尾换行。
 * 关键参数：rawCodeText 为代码块原始文本内容。
 * 返回值/副作用：返回至少为 1 的行数；无副作用。
 */
export function resolveCodeLineCount(rawCodeText: string): number {
  const normalizedText = rawCodeText.replace(/\r\n?/g, '\n');
  const trimmedTrailingNewline = normalizedText.endsWith('\n') ? normalizedText.slice(0, -1) : normalizedText;
  if (!trimmedTrailingNewline) {
    return 1;
  }
  return trimmedTrailingNewline.split('\n').length;
}

/**
 * 功能：为容器内启用行号的代码块刷新行号文本，兼容 HTML 序列化后的阅读态渲染。
 * 关键参数：container 为编辑器或阅读器容器 DOM。
 * 返回值/副作用：无返回值；副作用为写入 `pre` 节点 data-attributes。
 */
export function applyCodeLineNumberAttributes(container: HTMLElement | null): void {
  if (!container) {
    return;
  }

  const preElements = container.querySelectorAll('pre');
  preElements.forEach((preElement) => {
    const codeElement = preElement.querySelector('code');
    if (preElement.getAttribute('data-line-numbers') !== 'true' || !codeElement) {
      preElement.removeAttribute('data-line-number-gutter');
      return;
    }

    const lineCount = resolveCodeLineCount(codeElement.textContent ?? '');
    preElement.setAttribute('data-line-number-gutter', buildCodeLineNumberGutter(lineCount));
  });
}
