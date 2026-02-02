// Message Parser for AI responses
// Parses streaming AI output with <boltArtifact> and <boltAction> tags

export type ActionType = 'file' | 'shell' | 'start';

export interface FileAction {
  type: 'file';
  filePath: string;
  content: string;
}

export interface ShellAction {
  type: 'shell';
  content: string;
}

export interface StartAction {
  type: 'start';
  content: string;
}

export type BoltAction = FileAction | ShellAction | StartAction;

export interface BoltArtifactData {
  id: string;
  title: string;
  type?: string;
}

export interface ArtifactCallbackData extends BoltArtifactData {
  messageId: string;
  artifactId?: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  artifactCounter: number;
  currentArtifact?: BoltArtifactData;
  currentAction: Partial<BoltAction>;
  actionId: number;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);
  return match ? match[1] : content;
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export class StreamingMessageParser {
  private messages = new Map<string, MessageState>();
  private callbacks: ParserCallbacks;

  constructor(callbacks: ParserCallbacks = {}) {
    this.callbacks = callbacks;
  }

  parse(messageId: string, input: string): string {
    let state = this.messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        artifactCounter: 0,
        currentAction: { content: '' },
        actionId: 0,
      };
      this.messages.set(messageId, state);
    }

    let output = '';
    let i = state.position;
    let earlyBreak = false;

    while (i < input.length) {
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (!currentArtifact) {
          console.error('Artifact not initialized');
          break;
        }

        if (state.insideAction) {
          const closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);
          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            currentAction.content = (currentAction.content || '') + input.slice(i, closeIndex);

            let content = (currentAction.content || '').trim();

            if (currentAction.type === 'file' && 'filePath' in currentAction) {
              const filePath = (currentAction as FileAction).filePath;
              if (!filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }
              content += '\n';
            }

            currentAction.content = content;

            this.callbacks.onActionClose?.({
              artifactId: currentArtifact.id,
              messageId,
              actionId: String(state.actionId - 1),
              action: currentAction as BoltAction,
            });

            state.insideAction = false;
            state.currentAction = { content: '' };
            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            if (currentAction.type === 'file' && 'filePath' in currentAction) {
              let content = input.slice(i);
              const filePath = (currentAction as FileAction).filePath;
              
              if (!filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              this.callbacks.onActionStream?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: {
                  type: 'file',
                  filePath,
                  content,
                } as FileAction,
              });
            }
            break;
          }
        } else {
          const actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
          const artifactCloseIndex = input.indexOf(ARTIFACT_TAG_CLOSE, i);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;
              state.currentAction = this.parseActionTag(input, actionOpenIndex, actionEndIndex);

              this.callbacks.onActionOpen?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId++),
                action: state.currentAction as BoltAction,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this.callbacks.onArtifactClose?.({
              messageId,
              artifactId: currentArtifact.id,
              ...currentArtifact,
            });

            state.insideArtifact = false;
            state.currentArtifact = undefined;
            i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
          } else {
            break;
          }
        }
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';

        while (j < input.length && potentialTag.length < ARTIFACT_TAG_OPEN.length) {
          potentialTag += input[j];

          if (potentialTag === ARTIFACT_TAG_OPEN) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const artifactTag = input.slice(i, openTagEnd + 1);
              const artifactTitle = this.extractAttribute(artifactTag, 'title') || 'Untitled';
              const type = this.extractAttribute(artifactTag, 'type');
              const artifactId = `${messageId}-${state.artifactCounter++}`;

              state.insideArtifact = true;

              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
                type,
              };

              state.currentArtifact = currentArtifact;

              this.callbacks.onArtifactOpen?.({
                messageId,
                artifactId: currentArtifact.id,
                ...currentArtifact,
              });

              output += `<div class="__boltArtifact__" data-artifact-id="${artifactId}"></div>`;
              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
            output += input.slice(i, j + 1);
            i = j + 1;
            break;
          }

          j++;
        }

        if (j === input.length && ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
          break;
        }
      } else {
        output += input[i];
        i++;
      }

      if (earlyBreak) {
        break;
      }
    }

    state.position = i;
    return output;
  }

  reset() {
    this.messages.clear();
  }

  private parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number): Partial<BoltAction> {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);
    const actionType = this.extractAttribute(actionTag, 'type') as ActionType;

    const actionAttributes: Partial<BoltAction> = {
      type: actionType,
      content: '',
    };

    if (actionType === 'file') {
      const filePath = this.extractAttribute(actionTag, 'filePath') || '';
      (actionAttributes as FileAction).filePath = filePath;
    }

    return actionAttributes;
  }

  private extractAttribute(tag: string, attributeName: string): string | undefined {
    const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
    return match ? match[1] : undefined;
  }
}
