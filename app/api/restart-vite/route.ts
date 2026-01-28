// Restart Vite API
import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
}

export async function POST() {
  try {
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 });
    }
    
    console.log('[restart-vite] Restarting Vite server...');
    await provider.restartViteServer();
    
    return NextResponse.json({
      success: true,
      message: 'Vite server restarted'
    });
    
  } catch (error) {
    console.error('[restart-vite] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart Vite'
    }, { status: 500 });
  }
}
