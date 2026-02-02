// Action Runner - Executes file and shell actions in WebContainer
// Matches bolt.diy's action execution system

import { WebContainer } from '@webcontainer/api';
import { BoltAction, FileAction, ActionCallbackData } from './message-parser';

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export interface ActionState extends BoltAction {
  status: ActionStatus;
  executed: boolean;
  error?: string;
}

export class ActionRunner {
  private webcontainer: Promise<WebContainer>;
  private actions: Map<string, ActionState> = new Map();
  private executionQueue: Promise<void> = Promise.resolve();

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.webcontainer = webcontainerPromise;
  }

  getAction(actionId: string): ActionState | undefined {
    return this.actions.get(actionId);
  }

  getAllActions(): Map<string, ActionState> {
    return this.actions;
  }

  addAction(data: ActionCallbackData) {
    const { actionId, action } = data;

    if (this.actions.has(actionId)) {
      return;
    }

    this.actions.set(actionId, {
      ...action,
      status: 'pending',
      executed: false,
    });
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false): Promise<void> {
    const { actionId, action } = data;
    
    let actionState = this.actions.get(actionId);
    
    if (!actionState) {
      actionState = {
        ...action,
        status: 'pending',
        executed: false,
      };
      this.actions.set(actionId, actionState);
    }

    if (actionState.executed && !isStreaming) {
      return;
    }

    // Update state
    this.actions.set(actionId, {
      ...actionState,
      ...action,
      status: 'running',
      executed: !isStreaming,
    });

    // Queue the execution
    this.executionQueue = this.executionQueue
      .then(() => this.executeAction(actionId, action, isStreaming))
      .catch((error) => {
        console.error('[ActionRunner] Execution failed:', error);
        const state = this.actions.get(actionId);
        if (state) {
          this.actions.set(actionId, {
            ...state,
            status: 'failed',
            error: error.message,
          });
        }
      });

    await this.executionQueue;
  }

  private async executeAction(actionId: string, action: BoltAction, isStreaming: boolean = false): Promise<void> {
    const wc = await this.webcontainer;

    try {
      switch (action.type) {
        case 'file':
          await this.runFileAction(wc, action as FileAction);
          break;
        case 'shell':
          if (!isStreaming) {
            await this.runShellAction(wc, action.content);
          }
          break;
        case 'start':
          if (!isStreaming) {
            // Start commands run in background
            this.runShellAction(wc, action.content).catch(console.error);
          }
          break;
      }

      const state = this.actions.get(actionId);
      if (state) {
        this.actions.set(actionId, {
          ...state,
          status: isStreaming ? 'running' : 'complete',
        });
      }
    } catch (error: any) {
      const state = this.actions.get(actionId);
      if (state) {
        this.actions.set(actionId, {
          ...state,
          status: 'failed',
          error: error.message,
        });
      }
      throw error;
    }
  }

  private async runFileAction(wc: WebContainer, action: FileAction): Promise<void> {
    const { filePath, content } = action;
    
    // Ensure path is relative to workdir
    let relativePath = filePath;
    if (relativePath.startsWith('/home/project/')) {
      relativePath = relativePath.replace('/home/project/', '');
    } else if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1);
    }

    // Create parent directories if needed
    const parts = relativePath.split('/');
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      try {
        await wc.fs.mkdir(dir, { recursive: true });
      } catch (e) {
        // Directory might already exist
      }
    }

    // Write the file
    await wc.fs.writeFile(relativePath, content);
    console.log(`[ActionRunner] File written: ${relativePath}`);
  }

  private async runShellAction(wc: WebContainer, command: string): Promise<{ exitCode: number; output: string }> {
    console.log(`[ActionRunner] Running shell command: ${command}`);
    
    // Parse the command
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const process = await wc.spawn(cmd, args);
    
    let output = '';
    
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
          console.log(data);
        },
      })
    );

    const exitCode = await process.exit;
    
    if (exitCode !== 0) {
      throw new Error(`Command failed with exit code ${exitCode}: ${output}`);
    }

    return { exitCode, output };
  }
}
