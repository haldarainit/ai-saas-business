// Sandbox Types for AI App Builder
export interface SandboxFile {
  path: string;
  content: string;
  lastModified?: number;
}

export interface SandboxInfo {
  sandboxId: string;
  url: string;
  provider: 'e2b' | 'vercel';
  createdAt: Date;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface SandboxProviderConfig {
  e2b?: {
    apiKey: string;
    timeoutMs?: number;
    template?: string;
  };
  vercel?: {
    teamId?: string;
    projectId?: string;
    token?: string;
    authMethod?: 'oidc' | 'pat';
  };
}

export abstract class SandboxProvider {
  protected config: SandboxProviderConfig;
  protected sandbox: any;
  protected sandboxInfo: SandboxInfo | null = null;

  constructor(config: SandboxProviderConfig) {
    this.config = config;
  }

  abstract createSandbox(): Promise<SandboxInfo>;
  abstract runCommand(command: string): Promise<CommandResult>;
  abstract writeFile(path: string, content: string): Promise<void>;
  abstract readFile(path: string): Promise<string>;
  abstract listFiles(directory?: string): Promise<string[]>;
  abstract installPackages(packages: string[]): Promise<CommandResult>;
  abstract getSandboxUrl(): string | null;
  abstract getSandboxInfo(): SandboxInfo | null;
  abstract terminate(): Promise<void>;
  abstract isAlive(): boolean;
  
  // Optional methods that providers can override
  async setupViteApp(): Promise<void> {
    throw new Error('setupViteApp not implemented for this provider');
  }
  
  async restartViteServer(): Promise<void> {
    throw new Error('restartViteServer not implemented for this provider');
  }
}

// Sandbox State for global tracking
export interface SandboxState {
  fileCache: {
    files: Record<string, string>;
    lastSync: number;
    sandboxId: string;
  };
  sandbox: any;
  sandboxData: {
    sandboxId: string;
    url: string;
  };
}
