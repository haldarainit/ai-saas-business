
import { memo } from 'react';

export interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: string;
  scroll?: ScrollPosition;
}

export interface ScrollPosition {
  top?: number;
  left?: number;
  line?: number;
  column?: number;
}

export const CodeMirrorEditor = memo(() => {
    return <div>CodeMirrorEditor Placeholder</div>;
});

export default CodeMirrorEditor;
