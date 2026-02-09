import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '@/utils/constants';
import { cleanStackTrace } from '@/utils/stacktrace';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = (import.meta as any).hot?.data.webcontainerContext ?? {
  loaded: false,
};

if ((import.meta as any).hot) {
  (import.meta as any).hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (typeof window !== 'undefined') {
  // Use window as backup storage for the WebContainer promise to survive HMR where hot.data might be lost
  if (!(window as any).__WEBCONTAINER_PROMISE__) {
    (window as any).__WEBCONTAINER_PROMISE__ = (import.meta as any).hot?.data.webcontainer ??
      Promise.resolve()
        .then(() => {
          return WebContainer.boot({
            // coep: 'credentialless', // This might need Cross-Origin-Embedder-Policy header on the server
            // For now, let's try without if it causes issues, or keep it if setup allows. 
            // WebContainer requires COOP/COEP headers.
            coep: 'credentialless',
            workdirName: WORK_DIR_NAME,
            forwardPreviewErrors: true, // Enable error forwarding from iframes
          });
        })
        .then(async (webcontainer) => {
          webcontainerContext.loaded = true;

          const { workbenchStore } = await import('@/lib/stores/workbench');

          const response = await fetch('/inspector-script.js');
          const inspectorScript = await response.text();
          await webcontainer.setPreviewScript(inspectorScript);

          // Listen for preview errors
          webcontainer.on('preview-message', (message) => {
            console.log('WebContainer preview message:', message);

            // Handle both uncaught exceptions and unhandled promise rejections
            if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
              const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
              const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
              workbenchStore.actionAlert.set({
                type: 'preview',
                title,
                description: 'message' in message ? message.message : 'Unknown error',
                content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
                source: 'preview',
              });
            }
          });

          return webcontainer;
        });
  }
  
  webcontainer = (window as any).__WEBCONTAINER_PROMISE__;

  if ((import.meta as any).hot) {
    (import.meta as any).hot.data.webcontainer = webcontainer;
  }
}

export function isWebContainerSupported() {
  if (typeof window === 'undefined') return false;
  const hasSAB = (window as any).SharedArrayBuffer !== undefined;
  const isIsolated = (window as any).crossOriginIsolated === true;
  const isSecure = (window as any).isSecureContext === true;
  return hasSAB && isIsolated && isSecure;
}
