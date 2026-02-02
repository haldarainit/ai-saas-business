'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightSpecialChars } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  onScroll?: (scroll: { top: number; left: number }) => void;
}

const languageCompartment = new Compartment();

const getLanguageExtension = (language: string) => {
  switch (language) {
    case 'javascript':
    case 'jsx':
      return javascript({ jsx: true });
    case 'typescript':
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'html':
      return html();
    case 'css':
    case 'scss':
    case 'sass':
      return css();
    case 'json':
      return json();
    case 'markdown':
      return markdown();
    case 'python':
      return python();
    default:
      return javascript();
  }
};

export function CodeMirrorEditor({
  value,
  onChange,
  onSave,
  language = 'javascript',
  readOnly = false,
  className = '',
  onScroll
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalUpdate = useRef(false);

  // Handle save with Ctrl+S
  const handleSave = useCallback(() => {
    onSave?.();
    return true;
  }, [onSave]);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isInternalUpdate.current) {
        const newValue = update.state.doc.toString();
        onChange?.(newValue);
      }
    });

    const scrollListener = EditorView.domEventHandlers({
      scroll: (e, view) => {
        onScroll?.({
          top: view.scrollDOM.scrollTop,
          left: view.scrollDOM.scrollLeft
        });
      }
    });

    const customKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => handleSave()
      }
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab
        ]),
        customKeymap,
        languageCompartment.of(getLanguageExtension(language)),
        vscodeDark,
        updateListener,
        scrollListener,
        EditorView.lineWrapping,
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace'
          },
          '.cm-content': {
            padding: '10px 0'
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update content when value changes externally
  useEffect(() => {
    if (!viewRef.current) return;
    
    const currentValue = viewRef.current.state.doc.toString();
    if (currentValue !== value) {
      isInternalUpdate.current = true;
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value
        }
      });
      isInternalUpdate.current = false;
    }
  }, [value]);

  // Update language when it changes
  useEffect(() => {
    if (!viewRef.current) return;
    
    viewRef.current.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(language))
    });
  }, [language]);

  return (
    <div 
      ref={editorRef} 
      className={`h-full w-full overflow-hidden bg-[#1e1e1e] ${className}`}
    />
  );
}

export default CodeMirrorEditor;
