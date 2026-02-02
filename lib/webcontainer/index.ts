// WebContainer initialization and management
// This provides the core runtime for the AI builder

import { WebContainer } from '@webcontainer/api';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;

interface WebContainerContext {
  loaded: boolean;
  booting: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
  booting: false,
};

let webcontainerInstance: WebContainer | null = null;
let webcontainerPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  // Return existing instance if available
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  // Return existing promise if booting
  if (webcontainerPromise) {
    return webcontainerPromise;
  }
  
  // Start booting
  webcontainerContext.booting = true;
  
  webcontainerPromise = WebContainer.boot({
    coep: 'credentialless',
    workdirName: WORK_DIR_NAME,
  }).then(async (instance) => {
    webcontainerInstance = instance;
    webcontainerContext.loaded = true;
    webcontainerContext.booting = false;
    
    console.log('[WebContainer] Booted successfully');
    
    return instance;
  }).catch((error) => {
    webcontainerContext.booting = false;
    console.error('[WebContainer] Boot failed:', error);
    throw error;
  });
  
  return webcontainerPromise;
}

export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check for required headers (COOP/COEP)
  // These are set via Next.js middleware/headers
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  
  return hasSharedArrayBuffer;
}

// Check if webcontainer is ready
export function isWebContainerReady(): boolean {
  return webcontainerContext.loaded && webcontainerInstance !== null;
}
