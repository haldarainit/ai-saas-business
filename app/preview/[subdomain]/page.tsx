import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Workspace from "@/models/Workspace";
import SandpackPreviewClient from "../../landing-page-builder/components/SandpackPreviewClient";
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";

async function getWorkspaceBySubdomain(subdomain: string) {
    await dbConnect();
    const workspace = await Workspace.findOne({ subdomain }).lean();
    return workspace;
}

export default async function PreviewPage({ params }: { params: { subdomain: string } }) {
    const { subdomain } = await params;
    const workspace = await getWorkspaceBySubdomain(subdomain);

    if (!workspace) {
        return notFound();
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
