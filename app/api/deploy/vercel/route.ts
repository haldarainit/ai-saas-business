import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

interface DeployRequestBody {
  projectId?: string;
  files?: Record<string, string>;
  sourceFiles?: Record<string, string>;
  token?: string;
  chatId?: string;
  framework?: string;
}

interface VercelProjectInfo {
  id: string;
  name: string;
  url: string;
  chatId?: string;
}

const sanitizeName = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'builder';

const detectFramework = (files: Record<string, string>): string => {
  const packageJson = files['package.json'];

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

      if (dependencies.next) return 'nextjs';
      if (dependencies.react && dependencies['@remix-run/react']) return 'remix';
      if (dependencies.react && (dependencies.vite || dependencies['@vitejs/plugin-react'])) return 'vite';
      if (dependencies.react && dependencies['@nuxt/react']) return 'nuxt';
      if (dependencies.react && dependencies['@qwik-city/qwik']) return 'qwik';
      if (dependencies.react && dependencies['@sveltejs/kit']) return 'sveltekit';
      if (dependencies.react && dependencies.astro) return 'astro';
      if (dependencies.react && dependencies['@angular/core']) return 'angular';
      if (dependencies.react && dependencies.vue) return 'vue';
      if (dependencies.react && dependencies['@expo/react-native']) return 'expo';
      if (dependencies.react && dependencies['react-native']) return 'react-native';
      if (dependencies.react) return 'react';
      if (dependencies['@angular/core']) return 'angular';
      if (dependencies.vue) return 'vue';
      if (dependencies['@sveltejs/kit']) return 'sveltekit';
      if (dependencies.astro) return 'astro';
      if (dependencies['@nuxt/core']) return 'nuxt';
      if (dependencies['@qwik-city/qwik']) return 'qwik';
      if (dependencies['@expo/react-native']) return 'expo';
      if (dependencies['react-native']) return 'react-native';
      if (dependencies.vite) return 'vite';
      if (dependencies.webpack) return 'webpack';
      if (dependencies.parcel) return 'parcel';
      if (dependencies.rollup) return 'rollup';
      return 'nodejs';
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }

  if (files['next.config.js'] || files['next.config.ts']) return 'nextjs';
  if (files['remix.config.js'] || files['remix.config.ts']) return 'remix';
  if (files['vite.config.js'] || files['vite.config.ts']) return 'vite';
  if (files['nuxt.config.js'] || files['nuxt.config.ts']) return 'nuxt';
  if (files['svelte.config.js'] || files['svelte.config.ts']) return 'sveltekit';
  if (files['astro.config.js'] || files['astro.config.ts']) return 'astro';
  if (files['angular.json']) return 'angular';
  if (files['vue.config.js'] || files['vue.config.ts']) return 'vue';
  if (files['app.json'] && files['app.json'].includes('expo')) return 'expo';
  if (files['app.json'] && files['app.json'].includes('react-native')) return 'react-native';
  if (files['index.html']) return 'static';

  return 'other';
};

export async function POST(request: NextRequest) {
  try {
    const { projectId, files = {}, sourceFiles = {}, token, chatId, framework } =
      (await request.json()) as DeployRequestBody;

    if (!token) {
      return Response.json({ error: 'Not connected to Vercel' }, { status: 401 });
    }

    let targetProjectId = projectId;
    let projectInfo: VercelProjectInfo | undefined;
    let detectedFramework = framework;

    if (!detectedFramework && sourceFiles && Object.keys(sourceFiles).length > 0) {
      detectedFramework = detectFramework(sourceFiles);
    }

    if (!targetProjectId) {
      const projectName = sanitizeName(`builder-${chatId || 'chat'}-${Date.now()}`);
      const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          framework: detectedFramework || null,
        }),
      });

      if (!createProjectResponse.ok) {
        const errorData = (await createProjectResponse.json()) as any;
        return Response.json(
          { error: `Failed to create project: ${errorData.error?.message || 'Unknown error'}` },
          { status: 400 },
        );
      }

      const newProject = (await createProjectResponse.json()) as any;
      targetProjectId = newProject.id;
      projectInfo = {
        id: newProject.id,
        name: newProject.name,
        url: `https://${newProject.name}.vercel.app`,
        chatId,
      };
    } else {
      const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${targetProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectResponse.ok) {
        const existingProject = (await projectResponse.json()) as any;
        projectInfo = {
          id: existingProject.id,
          name: existingProject.name,
          url: `https://${existingProject.name}.vercel.app`,
          chatId,
        };
      } else {
        const projectName = sanitizeName(`builder-${chatId || 'chat'}-${Date.now()}`);
        const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            framework: detectedFramework || null,
          }),
        });

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json()) as any;
          return Response.json(
            { error: `Failed to create project: ${errorData.error?.message || 'Unknown error'}` },
            { status: 400 },
          );
        }

        const newProject = (await createProjectResponse.json()) as any;
        targetProjectId = newProject.id;
        projectInfo = {
          id: newProject.id,
          name: newProject.name,
          url: `https://${newProject.name}.vercel.app`,
          chatId,
        };
      }
    }

    const deploymentFiles: { file: string; data: string }[] = [];
    const shouldIncludeSourceFiles =
      detectedFramework &&
      ['nextjs', 'react', 'vite', 'remix', 'nuxt', 'sveltekit', 'astro', 'vue', 'angular'].includes(detectedFramework);

    const fileSource = shouldIncludeSourceFiles && Object.keys(sourceFiles).length > 0 ? sourceFiles : files;

    for (const [filePath, content] of Object.entries(fileSource)) {
      const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      if (!normalizedPath) continue;
      deploymentFiles.push({ file: normalizedPath, data: content });
    }

    if (deploymentFiles.length === 0) {
      return Response.json({ error: 'No files found to deploy' }, { status: 400 });
    }

    const deploymentConfig: any = {
      name: projectInfo?.name,
      project: targetProjectId,
      target: 'production',
      files: deploymentFiles,
      framework: detectedFramework || undefined,
    };

    if (detectedFramework === 'nextjs') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = '.next';
    } else if (detectedFramework === 'react' || detectedFramework === 'vite') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'remix') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'public';
    } else if (detectedFramework === 'nuxt') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = '.output';
    } else if (detectedFramework === 'sveltekit') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'build';
    } else if (detectedFramework === 'astro') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'vue') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else if (detectedFramework === 'angular') {
      deploymentConfig.buildCommand = 'npm run build';
      deploymentConfig.outputDirectory = 'dist';
    } else {
      deploymentConfig.routes = [{ src: '/(.*)', dest: '/$1' }];
    }

    const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentConfig),
    });

    if (!deployResponse.ok) {
      const errorData = (await deployResponse.json()) as any;
      return Response.json(
        { error: `Failed to create deployment: ${errorData.error?.message || 'Unknown error'}` },
        { status: 400 },
      );
    }

    const deployData = (await deployResponse.json()) as any;

    let retryCount = 0;
    const maxRetries = 60;
    let deploymentUrl = '';
    let deploymentState = '';

    while (retryCount < maxRetries) {
      const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as any;
        deploymentState = status.readyState;
        deploymentUrl = status.url ? `https://${status.url}` : '';

        if (status.readyState === 'READY' || status.readyState === 'ERROR') {
          break;
        }
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (deploymentState === 'ERROR') {
      return Response.json({ error: 'Deployment failed' }, { status: 500 });
    }

    if (retryCount >= maxRetries) {
      return Response.json({ error: 'Deployment timed out' }, { status: 500 });
    }

    return Response.json({
      success: true,
      deploy: {
        id: deployData.id,
        state: deploymentState,
        url: projectInfo?.url || deploymentUrl,
      },
      project: projectInfo,
    });
  } catch (error) {
    console.error('Vercel deploy error:', error);
    return Response.json({ error: 'Deployment failed' }, { status: 500 });
  }
}
