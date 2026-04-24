import type { createLowlight } from 'lowlight';
import { CodeBlockLowlight } from 'novel';
import {
  buildCodeLineNumberGutter,
  resolveCodeLineCount,
} from '@/features/post/editor/novel-demo/code-line-numbers';

interface CodeBlockNodeLike {
  attrs: Record<string, unknown>;
  textContent: string;
  type: {
    name: string;
  };
}

interface CodeBlockNodeViewProps {
  node: CodeBlockNodeLike;
  getPos: () => number;
  view: {
    state: {
      tr: {
        setNodeMarkup: (position: number, type: unknown, attributes: Record<string, unknown>) => unknown;
      };
    };
    dispatch: (transaction: unknown) => void;
  };
}

/**
 * 功能：根据代码块节点内容生成行号 gutter 文本。
 * 关键参数：node 为当前 codeBlock 节点。
 * 返回值/副作用：返回适配 CSS content 的行号字符串；无副作用。
 */
function resolveLineNumberGutter(node: CodeBlockNodeLike): string {
  return buildCodeLineNumberGutter(resolveCodeLineCount(node.textContent));
}

/**
 * 功能：创建代码块工具栏的行号切换按钮。
 * 关键参数：onToggle 为点击切换回调。
 * 返回值/副作用：返回按钮 DOM；副作用为绑定点击事件。
 */
function createLineNumberToggleButton(onToggle: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gmp-code-block-line-toggle';
  button.contentEditable = 'false';
  button.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10M4 6h1M4 12h1M4 18h1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    onToggle();
  });
  return button;
}

/**
 * 功能：创建代码块原生 NodeView，提供独立行号开关并保留 code 作为 contentDOM。
 * 关键参数：props 为 Tiptap NodeView 参数，包含 node 与 updateAttributes。
 * 返回值/副作用：返回 ProseMirror NodeView 对象；副作用为创建 DOM 与绑定按钮事件。
 */
function createCodeBlockNodeView(props: CodeBlockNodeViewProps) {
  let currentNode = props.node;
  const dom = document.createElement('div');
  const toolbar = document.createElement('div');
  const languageLabel = document.createElement('span');
  const pre = document.createElement('pre');
  const code = document.createElement('code');

  dom.className = 'gmp-code-block-card not-prose';
  toolbar.className = 'gmp-code-block-toolbar';
  toolbar.contentEditable = 'false';
  languageLabel.className = 'gmp-code-block-language';

  const toggleButton = createLineNumberToggleButton(() => {
    const position = props.getPos();
    const nextAttributes = {
      ...currentNode.attrs,
      lineNumbers: !Boolean(currentNode.attrs.lineNumbers),
    };
    props.view.dispatch(props.view.state.tr.setNodeMarkup(position, undefined, nextAttributes));
  });

  toolbar.append(languageLabel, toggleButton);
  pre.append(code);
  dom.append(toolbar, pre);

  /**
   * 功能：把当前节点 attrs 同步到代码块 DOM。
   * 关键参数：无（闭包读取 currentNode）。
   * 返回值/副作用：无返回值；副作用为更新 DOM attributes 与按钮状态。
   */
  function syncDomState(): void {
    const lineNumbersEnabled = Boolean(currentNode.attrs.lineNumbers);
    const language = typeof currentNode.attrs.language === 'string' ? currentNode.attrs.language : '';

    dom.dataset.lineNumbers = lineNumbersEnabled ? 'true' : 'false';
    pre.dataset.lineNumbers = lineNumbersEnabled ? 'true' : 'false';
    languageLabel.textContent = language || 'CODE';
    toggleButton.dataset.active = lineNumbersEnabled ? 'true' : 'false';
    toggleButton.ariaLabel = lineNumbersEnabled ? '隐藏当前代码块行号' : '显示当前代码块行号';
    toggleButton.title = lineNumbersEnabled ? '隐藏当前代码块行号' : '显示当前代码块行号';
    code.className = language ? `language-${language}` : '';

    if (lineNumbersEnabled) {
      pre.dataset.lineNumberGutter = resolveLineNumberGutter(currentNode);
      return;
    }

    delete pre.dataset.lineNumberGutter;
  }

  syncDomState();

  return {
    dom,
    contentDOM: code,
    update(nextNode: CodeBlockNodeLike) {
      if (nextNode.type.name !== currentNode.type.name) {
        return false;
      }
      currentNode = nextNode;
      syncDomState();
      return true;
    },
  };
}

/**
 * 功能：构建带行号 attrs 与原生 NodeView 的 CodeBlockLowlight 扩展。
 * 关键参数：lowlight 为 highlight.js 语言解析器实例。
 * 返回值/副作用：返回可替换默认 codeBlock 的 Tiptap 扩展；无副作用。
 */
export function createCodeBlockWithControls(lowlight: ReturnType<typeof createLowlight>) {
  return CodeBlockLowlight.extend({
    /**
     * 功能：扩展 codeBlock 节点属性，增加单代码块级别的行号开关。
     * 关键参数：无（由 Tiptap 扩展生命周期调用）。
     * 返回值/副作用：返回 attrs 配置；无副作用。
     */
    addAttributes() {
      return {
        ...this.parent?.(),
        lineNumbers: {
          default: false,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-line-numbers') === 'true',
          renderHTML: (attributes: Record<string, unknown>) => ({
            'data-line-numbers': Boolean(attributes.lineNumbers) ? 'true' : 'false',
          }),
        },
      };
    },
    /**
     * 功能：为 codeBlock 挂载原生 NodeView，提供工具栏与行号按钮。
     * 关键参数：无（由 Tiptap 扩展生命周期调用）。
     * 返回值/副作用：返回 NodeView 渲染器；无副作用。
     */
    addNodeView() {
      return (props) => createCodeBlockNodeView(props as unknown as CodeBlockNodeViewProps);
    },
  }).configure({
    lowlight,
  });
}
