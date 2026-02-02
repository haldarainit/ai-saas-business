'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalProps {
  onClose?: () => void;
}

export function Terminal({ onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [output, setOutput] = useState<string[]>([
    '\x1b[32m$ Welcome to AI Builder Terminal\x1b[0m',
    '\x1b[90mType commands to interact with your project...\x1b[0m',
    ''
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Process ANSI codes to HTML
  const processOutput = (text: string): string => {
    return text
      .replace(/\x1b\[32m/g, '<span class="text-green-400">')
      .replace(/\x1b\[31m/g, '<span class="text-red-400">')
      .replace(/\x1b\[33m/g, '<span class="text-yellow-400">')
      .replace(/\x1b\[34m/g, '<span class="text-blue-400">')
      .replace(/\x1b\[36m/g, '<span class="text-cyan-400">')
      .replace(/\x1b\[90m/g, '<span class="text-slate-500">')
      .replace(/\x1b\[0m/g, '</span>');
  };

  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on click
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Handle command execution
  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add to history
    setHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    // Add command to output
    setOutput(prev => [...prev, `\x1b[36m$ ${trimmedCommand}\x1b[0m`]);

    // Simulate command execution
    const args = trimmedCommand.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'clear':
        setOutput([]);
        break;
      case 'help':
        setOutput(prev => [
          ...prev,
          '\x1b[33mAvailable commands:\x1b[0m',
          '  help     - Show this help message',
          '  clear    - Clear terminal',
          '  ls       - List files',
          '  pwd      - Print working directory',
          '  echo     - Print text',
          '  npm      - Run npm commands (simulated)',
          ''
        ]);
        break;
      case 'ls':
        setOutput(prev => [
          ...prev,
          '\x1b[34mapp/\x1b[0m  \x1b[34mcomponents/\x1b[0m  \x1b[34mlib/\x1b[0m  package.json  tsconfig.json',
          ''
        ]);
        break;
      case 'pwd':
        setOutput(prev => [...prev, '/home/project', '']);
        break;
      case 'echo':
        setOutput(prev => [...prev, args.slice(1).join(' '), '']);
        break;
      case 'npm':
        if (args[1] === 'install' || args[1] === 'i') {
          setOutput(prev => [
            ...prev,
            '\x1b[32m⠋ Installing dependencies...\x1b[0m'
          ]);
          setTimeout(() => {
            setOutput(prev => [
              ...prev,
              '\x1b[32m✓ Packages installed successfully\x1b[0m',
              ''
            ]);
          }, 1500);
        } else if (args[1] === 'run' && args[2] === 'dev') {
          setOutput(prev => [
            ...prev,
            '\x1b[32m⠋ Starting development server...\x1b[0m'
          ]);
          setTimeout(() => {
            setOutput(prev => [
              ...prev,
              '\x1b[32m✓ Server running at http://localhost:3000\x1b[0m',
              ''
            ]);
          }, 1000);
        } else {
          setOutput(prev => [...prev, `npm ${args.slice(1).join(' ')}`, '']);
        }
        break;
      default:
        setOutput(prev => [
          ...prev,
          `\x1b[31mCommand not found: ${cmd}\x1b[0m`,
          '\x1b[90mType "help" for available commands\x1b[0m',
          ''
        ]);
    }

    setInput('');
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  return (
    <div 
      className={`flex flex-col bg-[#1a1a1a] border-t border-slate-700/50 ${
        isMaximized ? 'fixed inset-0 z-50' : 'h-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm text-slate-300">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm cursor-text"
        onClick={handleTerminalClick}
      >
        {output.map((line, index) => (
          <div
            key={index}
            className="text-slate-300 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processOutput(line) }}
          />
        ))}
        
        {/* Input line */}
        <div className="flex items-center text-slate-300">
          <span className="text-cyan-400">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-slate-300 ml-1"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

export default Terminal;
