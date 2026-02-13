// Sandbox Status API
import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  // eslint-disable-next-line no-var
  var sandboxData: any;
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
}

export async function GET() {
  try {
    // Try to get from sandbox manager first
    const managerInfo = sandboxManager.getActiveSandboxInfo();
    
    if (managerInfo) {
      const provider = sandboxManager.getActiveProvider();
      const isAlive = provider?.isAlive() ?? false;
      
      return NextResponse.json({
        active: true,
        healthy: isAlive,
        sandboxData: managerInfo,
        provider: 'managed'
      });
    }
    
    // Fall back to global state
    if (global.sandboxData && global.activeSandboxProvider) {
      const isAlive = global.activeSandboxProvider?.isAlive?.() ?? false;
      
      return NextResponse.json({
        active: true,
        healthy: isAlive,
        sandboxData: global.sandboxData,
        provider: 'global'
      });
    }
    
    return NextResponse.json({
      active: false,
      healthy: false,
      sandboxData: null,
      message: 'No active sandbox'
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({
      active: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Failed to check status'
    }, { status: 500 });
  }
}
