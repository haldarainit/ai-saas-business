import dbConnect from "@/lib/mongodb";
import Workspace from "@/models/Workspace";
import SandpackPreviewClient from "../../landing-page-builder/components/SandpackPreviewClient";
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getWorkspaceBySubdomain(subdomain: string) {
    await dbConnect();
    const workspace = await Workspace.findOne({ subdomain }).lean();
    return workspace;
}

export default async function PreviewPage({ params }: { params: { subdomain: string } }) {
    const { subdomain } = await params;
    const workspace = await getWorkspaceBySubdomain(subdomain);

    if (!workspace) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Site Not Found</h1>
                <p className="text-gray-600 max-w-md">
                    The site you are looking for <strong>{subdomain}</strong> does not exist or has not been deployed yet.
                </p>
                <div className="mt-8 text-sm text-gray-400">
                    Powered by AI Landing Page Builder
                </div>
            </div>
        );
    }

    const files = { ...Lookup.DEFAULT_FILE, ...(workspace.fileData || {}) };

    // Sanitize files similar to CodeViewWorkspace
    const sanitizedFiles = Object.entries(files).reduce((acc, [path, file]: [string, any]) => {
        let code = file;
        if (typeof file === 'object' && file !== null && 'code' in file) {
            code = file.code;
        }
        if (typeof code !== 'string') {
            code = typeof code === 'object' ? JSON.stringify(code, null, 2) : String(code);
        }
        acc[path] = { code };
        return acc;
    }, {} as Record<string, { code: string }>);


    return (
        <div className="h-screen w-screen overflow-hidden bg-white">
            <SandpackProvider
                files={sanitizedFiles}
                template="react"
                customSetup={{
                    dependencies: {
                        ...Lookup.DEPENDANCY,
                    },
                }}
                options={{
                    externalResources: ["https://cdn.tailwindcss.com"],
                    autoReload: true,
                    autorun: true,
                }}
            >
                <SandpackLayout style={{ height: "100vh", width: "100vw", border: "none" }}>
                    <SandpackPreview
                        style={{ height: "100%", width: "100%" }}
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
