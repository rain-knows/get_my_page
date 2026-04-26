import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView as CodeMirrorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type ViewUpdate,
} from '@codemirror/view';
import { exitCode } from '@tiptap/pm/commands';
import { undo, redo } from '@tiptap/pm/history';
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { Selection, TextSelection } from '@tiptap/pm/state';
import type { EditorView as ProseMirrorView } from '@tiptap/pm/view';
import type { createLowlight } from 'lowlight';
import { CodeBlockLowlight } from 'novel';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CodeBlockToolbar } from '@/features/post/editor/code-block/code-block-toolbar';
import {
  normalizeCodeBlockLanguage,
  resolveCodeMirrorLanguageExtension,
  type CodeBlockLanguage,
} from '@/features/post/editor/code-block/code-block-languages';
import {
  codeBlockEditorTheme,
  codeBlockHighlightStyle,
} from '@/features/post/editor/code-block/code-editor-extensions';

interface CodeBlockNodeViewProps {
  node: ProseMirrorNode;
  getPos: () => number;
  view: ProseMirrorView;
}

/**
 * 功能：延后卸载 React Root，避开 React 当前渲染栈内的同步卸载限制。
 * 关键参数：root 为代码块工具栏对应的 React Root。
 * 返回值/副作用：无返回值；副作用为在下一个宏任务卸载工具栏。
 */
function deferReactRootUnmount(root: Root): void {
  window.setTimeout(() => {
    root.unmount();
  }, 0);
}

/**
 * 功能：读取当前代码块节点语言并归一化为统一语言类型。
 * 关键参数：node 为当前 ProseMirror 代码块节点。
 * 返回值/副作用：返回统一 CodeBlockLanguage；无副作用。
 */
function readNodeLanguage(node: ProseMirrorNode): CodeBlockLanguage {
  return normalizeCodeBlockLanguage(node.attrs.language);
}

/**
 * 功能：判断当前代码块节点是否启用行号。
 * 关键参数：node 为当前 ProseMirror 代码块节点。
 * 返回值/副作用：返回行号启用状态；无副作用。
 */
function readNodeLineNumbers(node: ProseMirrorNode): boolean {
  return node.attrs.lineNumbers !== false;
}

/**
 * 功能：更新当前代码块节点属性。
 * 关键参数：pmView 为外层编辑器视图；getPos 为节点位置函数；node 为当前节点；attrs 为待覆盖属性。
 * 返回值/副作用：无返回值；副作用为派发 ProseMirror 节点属性事务。
 */
function updateCodeBlockNodeAttrs(
  pmView: ProseMirrorView,
  getPos: () => number,
  node: ProseMirrorNode,
  attrs: Record<string, unknown>,
): void {
  pmView.dispatch(pmView.state.tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, ...attrs }));
}

/**
 * 功能：将 CodeMirror 文本差异同步回 ProseMirror 文档，并保持外层选区与内层选区一致。
 * 关键参数：pmView 为外层编辑器；getPos 为节点位置函数；update 为 CodeMirror 更新对象；schema 为 ProseMirror schema。
 * 返回值/副作用：无返回值；副作用为向 ProseMirror 派发事务。
 */
function forwardCodeMirrorUpdate(
  pmView: ProseMirrorView,
  getPos: () => number,
  update: ViewUpdate,
  schema: Schema,
): void {
  let offset = getPos() + 1;
  const selection = update.state.selection.main;
  const selectionFrom = offset + selection.from;
  const selectionTo = offset + selection.to;
  const proseMirrorSelection = pmView.state.selection;

  if (!update.docChanged && proseMirrorSelection.from === selectionFrom && proseMirrorSelection.to === selectionTo) {
    return;
  }

  const transaction = pmView.state.tr;
  update.changes.iterChanges((fromA, toA, fromB, toB, insertedText) => {
    const insertedValue = insertedText.toString();
    if (insertedValue.length > 0) {
      transaction.replaceWith(offset + fromA, offset + toA, schema.text(insertedValue));
    } else {
      transaction.delete(offset + fromA, offset + toA);
    }
    offset += (toB - fromB) - (toA - fromA);
  });

  transaction.setSelection(TextSelection.create(transaction.doc, selectionFrom, selectionTo));
  pmView.dispatch(transaction);
}

/**
 * 功能：创建代码块 NodeView 对应的 CodeMirror 键位，处理跨编辑器光标逃逸与常用撤销重做。
 * 关键参数：pmView 为外层 ProseMirror 视图；getPos 为节点位置函数；readCodeMirrorState 为读取当前 CodeMirror 状态的函数；readNode 为读取当前节点的函数。
 * 返回值/副作用：返回 CodeMirror 键位扩展数组；副作用为在命中时更新外层编辑器选区或事务。
 */
function createCodeMirrorKeyBindings(
  pmView: ProseMirrorView,
  getPos: () => number,
  readCodeMirrorState: () => EditorState,
  readNode: () => ProseMirrorNode,
): Extension {
  /**
   * 功能：在光标位于代码块首尾时把焦点移回外层富文本编辑器，保持方向键穿透体验自然。
   * 关键参数：unit 为比较单位；direction 为移动方向。
   * 返回值/副作用：返回是否完成逃逸；副作用为更新 ProseMirror 选区并切回焦点。
   */
  const maybeEscape = (unit: 'char' | 'line', direction: -1 | 1): boolean => {
    const codeMirrorSelection = readCodeMirrorState().selection.main;
    if (!codeMirrorSelection.empty) {
      return false;
    }

    let boundaryFrom = codeMirrorSelection.from;
    let boundaryTo = codeMirrorSelection.to;
    if (unit === 'line') {
      const activeLine = readCodeMirrorState().doc.lineAt(codeMirrorSelection.head);
      boundaryFrom = activeLine.from;
      boundaryTo = activeLine.to;
    }

    if (direction < 0 ? boundaryFrom > 0 : boundaryTo < readCodeMirrorState().doc.length) {
      return false;
    }

    const targetPosition = getPos() + (direction < 0 ? 0 : readNode().nodeSize);
    const nextSelection = Selection.near(pmView.state.doc.resolve(targetPosition), direction);
    pmView.dispatch(pmView.state.tr.setSelection(nextSelection).scrollIntoView());
    pmView.focus();
    return true;
  };

  return keymap.of([
    { key: 'ArrowUp', run: () => maybeEscape('line', -1) },
    { key: 'ArrowLeft', run: () => maybeEscape('char', -1) },
    { key: 'ArrowDown', run: () => maybeEscape('line', 1) },
    { key: 'ArrowRight', run: () => maybeEscape('char', 1) },
    {
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        if (!exitCode(pmView.state, pmView.dispatch)) {
          return false;
        }
        pmView.focus();
        return true;
      },
    },
    {
      key: 'Ctrl-z',
      mac: 'Cmd-z',
      run: () => undo(pmView.state, pmView.dispatch),
    },
    {
      key: 'Shift-Ctrl-z',
      mac: 'Shift-Cmd-z',
      run: () => redo(pmView.state, pmView.dispatch),
    },
    {
      key: 'Ctrl-y',
      mac: 'Cmd-y',
      run: () => redo(pmView.state, pmView.dispatch),
    },
    indentWithTab,
    ...defaultKeymap,
  ]);
}

/**
 * 功能：创建基于 CodeMirror 的代码块 NodeView，统一接管代码编辑、语言选择、复制与行号显示。
 * 关键参数：props 为 Tiptap NodeView 参数，包含节点、位置与外层视图。
 * 返回值/副作用：返回 ProseMirror NodeView 对象；副作用为创建 CodeMirror 与 React toolbar 并同步双向内容。
 */
function createCodeBlockNodeView(props: CodeBlockNodeViewProps) {
  let currentNode = props.node;
  let isSyncingFromProseMirror = false;
  let isDestroyed = false;

  const dom = document.createElement('div');
  const toolbarHost = document.createElement('div');
  const editorHost = document.createElement('div');
  const lineNumberCompartment = new Compartment();
  const languageCompartment = new Compartment();
  const editableCompartment = new Compartment();
  let codeMirrorView: CodeMirrorView | null = null;
  let toolbarRoot: Root | null = null;

  dom.className = 'gmp-code-block-card not-prose';
  toolbarHost.contentEditable = 'false';
  editorHost.className = 'gmp-code-block-editor';
  dom.append(toolbarHost, editorHost);

  /**
   * 功能：渲染 React 代码块工具栏并绑定 Tiptap 节点属性更新。
   * 关键参数：无（闭包读取 currentNode、props 与 codeMirrorView）。
   * 返回值/副作用：无返回值；副作用为渲染或更新 React toolbar。
   */
  function renderToolbar(): void {
    if (isDestroyed) {
      return;
    }

    if (!toolbarRoot) {
      toolbarRoot = createRoot(toolbarHost);
    }

    toolbarRoot.render(
      createElement(CodeBlockToolbar, {
        code: codeMirrorView?.state.doc.toString() ?? currentNode.textContent,
        language: readNodeLanguage(currentNode),
        lineNumbersEnabled: readNodeLineNumbers(currentNode),
        onLanguageChange: (language: CodeBlockLanguage) => {
          updateCodeBlockNodeAttrs(props.view, props.getPos, currentNode, { language });
        },
        onLineNumbersChange: (enabled: boolean) => {
          updateCodeBlockNodeAttrs(props.view, props.getPos, currentNode, { lineNumbers: enabled });
        },
        readOnly: !props.view.editable,
        showCopyButton: true,
        showLanguageSelect: props.view.editable,
        showLineNumberToggle: props.view.editable,
      }),
    );
  }

  const codeMirrorState = EditorState.create({
    doc: currentNode.textContent,
    extensions: [
      codeBlockEditorTheme,
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      syntaxHighlighting(codeBlockHighlightStyle),
      createCodeMirrorKeyBindings(
        props.view,
        props.getPos,
        () => codeMirrorView?.state ?? codeMirrorState,
        () => currentNode,
      ),
      editableCompartment.of([
        EditorState.readOnly.of(!props.view.editable),
        CodeMirrorView.editable.of(props.view.editable),
      ]),
      lineNumberCompartment.of(readNodeLineNumbers(currentNode) ? lineNumbers() : []),
      languageCompartment.of(resolveCodeMirrorLanguageExtension(readNodeLanguage(currentNode))),
      CodeMirrorView.updateListener.of((update) => {
        if (isSyncingFromProseMirror || !codeMirrorView?.hasFocus) {
          return;
        }
        forwardCodeMirrorUpdate(props.view, props.getPos, update, props.view.state.schema);
        if (update.docChanged) {
          renderToolbar();
        }
      }),
    ],
  });

  codeMirrorView = new CodeMirrorView({
    parent: editorHost,
    state: codeMirrorState,
  });

  /**
   * 功能：把当前节点 attrs 同步到代码块 DOM、React toolbar 与 CodeMirror 配置。
   * 关键参数：无（闭包读取 currentNode）。
   * 返回值/副作用：无返回值；副作用为更新 DOM dataset、toolbar 与 CodeMirror compartments。
   */
  function syncDomState(): void {
    if (isDestroyed) {
      return;
    }

    const lineNumbersEnabled = readNodeLineNumbers(currentNode);
    const language = readNodeLanguage(currentNode);

    dom.dataset.lineNumbers = lineNumbersEnabled ? 'true' : 'false';
    dom.dataset.editable = props.view.editable ? 'true' : 'false';

    codeMirrorView?.dispatch({
      effects: [
        editableCompartment.reconfigure([
          EditorState.readOnly.of(!props.view.editable),
          CodeMirrorView.editable.of(props.view.editable),
        ]),
        lineNumberCompartment.reconfigure(lineNumbersEnabled ? lineNumbers() : []),
        languageCompartment.reconfigure(resolveCodeMirrorLanguageExtension(language)),
      ],
    });

    renderToolbar();
  }

  syncDomState();

  return {
    dom,
    update(nextNode: ProseMirrorNode) {
      if (nextNode.type !== currentNode.type) {
        return false;
      }

      currentNode = nextNode;
      syncDomState();

      const activeCodeMirrorView = codeMirrorView;
      if (!activeCodeMirrorView) {
        return false;
      }

      const nextText = currentNode.textContent;
      const currentText = activeCodeMirrorView.state.doc.toString();
      if (nextText !== currentText) {
        let start = 0;
        let currentEnd = currentText.length;
        let nextEnd = nextText.length;

        while (start < currentEnd && start < nextEnd && currentText.charCodeAt(start) === nextText.charCodeAt(start)) {
          start += 1;
        }
        while (
          currentEnd > start &&
          nextEnd > start &&
          currentText.charCodeAt(currentEnd - 1) === nextText.charCodeAt(nextEnd - 1)
        ) {
          currentEnd -= 1;
          nextEnd -= 1;
        }

        isSyncingFromProseMirror = true;
        activeCodeMirrorView.dispatch({
          changes: {
            from: start,
            to: currentEnd,
            insert: nextText.slice(start, nextEnd),
          },
        });
        isSyncingFromProseMirror = false;
        renderToolbar();
      }

      return true;
    },
    selectNode() {
      if (!props.view.editable) {
        return;
      }
      codeMirrorView?.focus();
    },
    setSelection(anchor: number, head: number) {
      codeMirrorView?.focus();
      isSyncingFromProseMirror = true;
      codeMirrorView?.dispatch({
        selection: {
          anchor,
          head,
        },
      });
      isSyncingFromProseMirror = false;
    },
    stopEvent() {
      return true;
    },
    ignoreMutation() {
      return true;
    },
    destroy() {
      isDestroyed = true;
      if (toolbarRoot) {
        deferReactRootUnmount(toolbarRoot);
        toolbarRoot = null;
      }
      codeMirrorView?.destroy();
      codeMirrorView = null;
    },
  };
}

/**
 * 功能：构建带语言选择、复制与 CodeMirror NodeView 的 CodeBlockLowlight 扩展。
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
          default: true,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-line-numbers') !== 'false',
          renderHTML: (attributes: Record<string, unknown>) => ({
            'data-line-numbers': attributes.lineNumbers === false ? 'false' : 'true',
          }),
        },
      };
    },
    /**
     * 功能：为 codeBlock 挂载 CodeMirror NodeView，统一接管代码文本编辑与工具栏交互。
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
