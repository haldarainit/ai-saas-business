// E2B Sandbox Provider
import { Sandbox } from '@e2b/code-interpreter';
import { SandboxProvider, SandboxInfo, CommandResult } from '@/types/sandbox';

export class E2BProvider extends SandboxProvider {
  private existingFiles: Set<string> = new Set();

  async createSandbox(): Promise<SandboxInfo> {
    try {
      // Kill existing sandbox if any
      if (this.sandbox) {
        try {
          await this.sandbox.kill();
        } catch (e) {
          console.error('Failed to kill existing sandbox:', e);
        }
        this.sandbox = null;
      }
      
      // Clear existing files tracking
      this.existingFiles.clear();

      // Create E2B sandbox
      console.log('[E2BProvider] Creating sandbox...');
      this.sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: 300000, // 5 minutes
      });
      
      const sandboxId = this.sandbox.sandboxId;
      
      // Get the sandbox URL for port 5173 (Vite)
      const sandboxUrl = await this.sandbox.getHost(5173);

      this.sandboxInfo = {
        sandboxId,
        url: `https://${sandboxUrl}`,
        provider: 'e2b',
        createdAt: new Date()
      };

      console.log('[E2BProvider] Sandbox created:', this.sandboxInfo);
      return this.sandboxInfo;

    } catch (error) {
      console.error('[E2BProvider] Error creating sandbox:', error);
      throw error;
    }
  }

  async reconnect(sandboxId: string): Promise<boolean> {
    try {
      console.log('[E2BProvider] Attempting to reconnect to sandbox:', sandboxId);
      this.sandbox = await Sandbox.connect(sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });
      
      const sandboxUrl = await this.sandbox.getHost(5173);
      
      this.sandboxInfo = {
        sandboxId,
        url: `https://${sandboxUrl}`,
        provider: 'e2b',
        createdAt: new Date()
      };
      
      console.log('[E2BProvider] Reconnected successfully');
      return true;
    } catch (error) {
      console.error('[E2BProvider] Failed to reconnect:', error);
      return false;
    }
  }

  async runCommand(command: string): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    try {
      const result = await this.sandbox.commands.run(command, {
        cwd: '/home/user',
      });
      
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode || 0,
        success: result.exitCode === 0
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        stdout: '',
        stderr: err.message || 'Command failed',
        exitCode: 1,
        success: false
      };
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `/home/user/${path}`;
    
    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (dir) {
      await this.sandbox.commands.run(`mkdir -p "${dir}"`);
    }
    
    await this.sandbox.files.write(fullPath, content);
    this.existingFiles.add(path);
  }

  async readFile(path: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `/home/user/${path}`;
    return await this.sandbox.files.read(fullPath);
  }

  async listFiles(directory: string = '/home/user'): Promise<string[]> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const result = await this.sandbox.commands.run(
      `find ${directory} -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | sed "s|^${directory}/||"`,
      { cwd: '/' }
    );
    
    if (result.exitCode !== 0) {
      return [];
    }
    
    return (result.stdout || '').split('\n').filter((line: string) => line.trim() !== '');
  }

  async installPackages(packages: string[]): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const flags = process.env.NPM_FLAGS || '--legacy-peer-deps';
    const command = `npm install ${flags} ${packages.join(' ')}`;
    
    const result = await this.sandbox.commands.run(command, {
      cwd: '/home/user'
    });
    
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode || 0,
      success: result.exitCode === 0
    };
  }

  async setupViteApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Setting up Vite app...');
    
    // Create directory structure
    await this.sandbox.commands.run('mkdir -p /home/user/src');
    
    // Create package.json
    const packageJson = {
      name: "sandbox-app",
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite --host",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        vite: "^4.3.9",
        tailwindcss: "^3.3.0",
        postcss: "^8.4.31",
        autoprefixer: "^10.4.16"
      }
    };
    
    await this.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    
    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
  }
})`;
    
    await this.writeFile('vite.config.js', viteConfig);
    
    // Create tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    
    await this.writeFile('tailwind.config.js', tailwindConfig);
    
    // Create postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    
    await this.writeFile('postcss.config.js', postcssConfig);
    
    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    
    await this.writeFile('index.html', indexHtml);
    
    // Create src/main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    
    await this.writeFile('src/main.jsx', mainJsx);
    
    // Create src/App.jsx
    const appJsx = `function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">AI App Builder</h1>
        <p className="text-lg text-gray-400">
          Your sandbox is ready! Start building with React, Vite, and Tailwind CSS.
        </p>
      </div>
    </div>
  )
}

export default App`;
    
    await this.writeFile('src/App.jsx', appJsx);
    
    // Create src/index.css
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
}`;
    
    await this.writeFile('src/index.css', indexCss);
    
    // Install dependencies
    console.log('[E2BProvider] Installing npm dependencies...');
    await this.sandbox.commands.run('npm install', { cwd: '/home/user' });
    
    // Start Vite dev server in background
    console.log('[E2BProvider] Starting Vite dev server...');
    await this.sandbox.commands.run('npm run dev &', { 
      cwd: '/home/user',
      background: true 
    });
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    console.log('[E2BProvider] Vite app setup complete!');
  }

  async restartViteServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Restarting Vite server...');
    
    // Kill existing Vite process
    await this.sandbox.commands.run('pkill -f vite || true');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start Vite in background
    await this.sandbox.commands.run('npm run dev &', { 
      cwd: '/home/user',
      background: true 
    });
    
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  getSandboxUrl(): string | null {
    return this.sandboxInfo?.url || null;
  }

  getSandboxInfo(): SandboxInfo | null {
    return this.sandboxInfo;
  }

  async terminate(): Promise<void> {
    if (this.sandbox) {
      try {
        await this.sandbox.kill();
      } catch (e) {
        console.error('Failed to terminate sandbox:', e);
      }
      this.sandbox = null;
      this.sandboxInfo = null;
    }
  }

  isAlive(): boolean {
    return !!this.sandbox;
  }
}
