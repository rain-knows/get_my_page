/**
 * 功能：将代码文本行数转换为行号数组，供编辑态与阅读态真实 DOM gutter 复用。
 * 关键参数：lineCount 为代码块总行数。
 * 返回值/副作用：返回行号字符串数组；无副作用。
 */
export function buildCodeLineNumbers(lineCount: number): string[] {
  return Array.from({ length: Math.max(1, lineCount) }, (_, index) => String(index + 1));
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
 * 功能：为指定代码块刷新真实 DOM 行号 gutter，避免长代码依赖 data-attribute 文本导致截断。
 * 关键参数：preElement 为代码块 `pre` 节点；lineCount 为代码块总行数。
 * 返回值/副作用：无返回值；副作用为增量更新 `.gmp-code-line-number-gutter` 节点。
 */
export function syncCodeLineNumberGutter(preElement: HTMLElement, lineCount: number): void {
  let gutter = preElement.querySelector<HTMLElement>(':scope > .gmp-code-line-number-gutter');
  if (!gutter) {
    gutter = document.createElement('span');
    gutter.className = 'gmp-code-line-number-gutter';
    gutter.contentEditable = 'false';
    preElement.prepend(gutter);
  }

  gutter.replaceChildren(
    ...buildCodeLineNumbers(lineCount).map((lineNumber) => {
      const item = document.createElement('span');
      item.className = 'gmp-code-line-number';
      item.textContent = lineNumber;
      return item;
    }),
  );
}

/**
 * 功能：移除指定代码块的真实 DOM 行号 gutter，供关闭行号或非行号代码块复位。
 * 关键参数：preElement 为代码块 `pre` 节点。
 * 返回值/副作用：无返回值；副作用为删除 `.gmp-code-line-number-gutter` 节点。
 */
export function removeCodeLineNumberGutter(preElement: HTMLElement): void {
  preElement.querySelector<HTMLElement>(':scope > .gmp-code-line-number-gutter')?.remove();
}

/**
 * 功能：为容器内启用行号的代码块刷新行号 DOM，兼容 HTML 序列化后的阅读态渲染。
 * 关键参数：container 为编辑器或阅读器容器 DOM。
 * 返回值/副作用：无返回值；副作用为写入或移除行号 gutter 节点。
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
      removeCodeLineNumberGutter(preElement);
      return;
    }

    const lineCount = resolveCodeLineCount(codeElement.textContent ?? '');
    preElement.removeAttribute('data-line-number-gutter');
    syncCodeLineNumberGutter(preElement, lineCount);
  });
}
