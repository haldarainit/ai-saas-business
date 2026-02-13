import type { ITheme } from '@xterm/xterm';

type TerminalMode = 'light' | 'dark';

function getThemeStyle(mode?: TerminalMode): CSSStyleDeclaration | null {
  if (typeof window === 'undefined') return null;

  const root = document.documentElement;

  if (!mode) {
    return getComputedStyle(root);
  }

  const probe = document.createElement('div');
  if (mode === 'dark') {
    probe.classList.add('dark');
  }
  probe.style.display = 'none';
  root.appendChild(probe);

  const style = getComputedStyle(probe);
  root.removeChild(probe);

  return style;
}

export function getTerminalTheme(overrides?: ITheme, mode?: TerminalMode): ITheme {
  if (typeof window === 'undefined') {
    return { ...overrides };
  }

  const style = getThemeStyle(mode);
  if (!style) {
    return { ...overrides };
  }
  const cssVar = (token: string) => style.getPropertyValue(token).trim() || undefined;

  return {
    cursor: cssVar('--bolt-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--bolt-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--bolt-elements-terminal-textColor'),
    background: cssVar('--bolt-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--bolt-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--bolt-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--bolt-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--bolt-elements-terminal-color-black'),
    red: cssVar('--bolt-elements-terminal-color-red'),
    green: cssVar('--bolt-elements-terminal-color-green'),
    yellow: cssVar('--bolt-elements-terminal-color-yellow'),
    blue: cssVar('--bolt-elements-terminal-color-blue'),
    magenta: cssVar('--bolt-elements-terminal-color-magenta'),
    cyan: cssVar('--bolt-elements-terminal-color-cyan'),
    white: cssVar('--bolt-elements-terminal-color-white'),
    brightBlack: cssVar('--bolt-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--bolt-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--bolt-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--bolt-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--bolt-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--bolt-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--bolt-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--bolt-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
