// Kill Sandbox API
import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
  // eslint-disable-next-line no-var
  var sandboxData: any;
}

export async function POST() {
  try {
    console.log('[kill-sandbox] Terminating all sandboxes...');
    
    // Terminate via sandbox manager
    await sandboxManager.terminateAll();
    
    // Also clean up global state
    if (global.activeSandboxProvider) {
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to terminate global sandbox:', e);
      }
      global.activeSandboxProvider = null;
    }
    
    global.sandboxData = null;
    
    return NextResponse.json({
      success: true,
      message: 'All sandboxes terminated'
    });
    
  } catch (error) {
    console.error('[kill-sandbox] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to kill sandbox'
    }, { status: 500 });
  }
}
