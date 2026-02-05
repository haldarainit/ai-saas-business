import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '@/lib/runtime/action-runner';
import { useWorkbenchStore } from '@/lib/stores/workbench';
import { classNames } from '@/utils/classNames';
import { cubicEasingFn } from '@/utils/easings';
import { WORK_DIR } from '@/utils/constants';

// Initialize highlighter lazily or similar
let shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | null = null;

const initHighlighter = async () => {
    if (!shellHighlighter) {
        shellHighlighter = await createHighlighter({
             langs: ['shell'],
             themes: ['light-plus', 'dark-plus'],
        });
    }
    return shellHighlighter;
};

interface ArtifactProps {
  messageId: string;
  artifactId: string;
}

export const Artifact = memo(({ artifactId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);
  
  // Adjusted for useWorkbenchStore
  const { 
    artifacts, 
    showWorkbench, 
    setShowWorkbench 
  } = useWorkbenchStore();
  const artifact = artifacts[artifactId];
  
  // Re-implement the actions computed store since we can't use `computed` directly on the hook result in the same way
  // We will derive it from the artifact runner actions
  const actionsMap = useStore(artifact?.runner.actions || computed({} as any, () => ({}))); // Fallback if artifact is missing

  const actions = Object.entries(actionsMap)
    .filter(([, action]) => {
      // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
      return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
    })
    .map(([id, action]) => ({ id, action }));


  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact?.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact?.type, allActionFinished]);

  if (!artifact) return null;

  // Determine the dynamic title based on state for bundled artifacts
  const dynamicTitle =
    artifact?.type === 'bundled'
      ? allActionFinished
        ? artifact.id === 'restored-project-setup'
          ? 'Project Restored' // Title when restore is complete
          : 'Project Created' // Title when initial creation is complete
        : artifact.id === 'restored-project-setup'
          ? 'Restoring Project...' // Title during restore
          : 'Creating Project...' // Title during initial creation
      : artifact?.title; // Fallback to original title for non-bundled or if artifact is missing

  return (
    <>
      <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
        <div className="flex">
          <button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
            onClick={() => {
              setShowWorkbench(!showWorkbench);
            }}
          >
            <div className="px-5 p-3.5 w-full text-left">
              <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">
                {/* Use the dynamic title here */}
                {dynamicTitle}
              </div>
              <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">
                Click to open Workbench
              </div>
            </div>
          </button>
          {artifact.type !== 'bundled' && <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />}
          <AnimatePresence>
            {actions.length && artifact.type !== 'bundled' && (
              <motion.button
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                exit={{ width: 0 }}
                transition={{ duration: 0.15, ease: cubicEasingFn }}
                className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
                onClick={toggleActions}
              >
                <div className="p-4">
                  <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {artifact.type === 'bundled' && (
          <div className="flex items-center gap-1.5 p-5 bg-bolt-elements-actions-background border-t border-bolt-elements-artifacts-borderColor">
            <div className={classNames('text-lg', getIconColor(allActionFinished ? 'complete' : 'running'))}>
              {allActionFinished ? (
                <div className="i-ph:check"></div>
              ) : (
                <div className="i-svg-spinners:90-ring-with-bg"></div>
              )}
            </div>
            <div className="text-bolt-elements-textPrimary font-medium leading-5 text-sm">
              {/* This status text remains the same */}
              {allActionFinished
                ? artifact.id === 'restored-project-setup'
                  ? 'Restore files from snapshot'
                  : 'Initial files created'
                : 'Creating initial files'}
            </div>
          </div>
        )}
        <AnimatePresence>
          {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
            <motion.div
              className="actions"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: '0px' }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

              <div className="p-5 text-left bg-bolt-elements-actions-background">
                <ActionList actions={actions} runner={artifact.runner} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
      initHighlighter().then(highlighter => {
          setHtml(highlighter.codeToHtml(code, {
              lang: 'shell',
              theme: 'dark-plus',
            }));
      })
  }, [code]);

  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: html
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: { id: string; action: ActionState }[];
  runner: { rerunAction: (actionId: string) => Promise<void> };
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function openArtifactInWorkbenchStore(filePath: any) {
    // This needs to be connected to the store properly, for now assuming the hook is used in components
    // but this helper might need refactoring or Context
    // We will just expose this logic and let the component handle it or use a global store instance if available
}

const ActionList = memo(({ actions, runner }: ActionListProps) => {
  const { currentView, setCurrentView, setSelectedFile } = useWorkbenchStore(); 
  
  const openArtifact = (filePath: string) => {
      if (currentView !== 'code') {
        setCurrentView('code');
      }
      setSelectedFile(`${WORK_DIR}/${filePath}`);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map(({ id, action }, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;
          const canRetry = status === 'failed' || status === 'aborted';
          const retryLabel = type === 'start' ? 'Restart' : 'Retry';

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type !== 'start' ? (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      ) : (
                        <div className="i-ph:terminal-window-duotone"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone"></div>
                  ) : status === 'complete' ? (
                    <div className="i-ph:check"></div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  <div>
                    Create{' '}
                    <code
                      className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-bolt-elements-item-contentAccent hover:underline cursor-pointer"
                      onClick={() => openArtifact(action.filePath)}
                    >
                      {action.filePath}
                    </code>
                  </div>
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Run command</span>
                    {canRetry && (
                      <button
                        onClick={() => runner.rerunAction(id)}
                        className="text-xs px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200"
                      >
                        {retryLabel}
                      </button>
                    )}
                  </div>
                ) : type === 'start' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentView('preview');
                      }}
                      className="flex-1"
                    >
                      Start Application
                    </a>
                    {canRetry && (
                      <button
                        onClick={() => runner.rerunAction(id)}
                        className="text-xs px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200"
                      >
                        {retryLabel}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              {(type === 'shell' || type === 'start') && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
