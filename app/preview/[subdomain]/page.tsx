import dbConnect from "@/lib/mongodb";
import Workspace from "@/models/Workspace";
import Lookup from "@/data/Lookup";
import { AlertTriangle, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import PreviewClient from "./PreviewClient";

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Construction className="w-10 h-10 text-yellow-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Not Found</h1>

                    <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-100">
                        <p className="text-gray-500 text-sm font-medium">Attempted to access:</p>
                        <p className="text-gray-900 font-mono text-lg">{subdomain}</p>
                    </div>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        The site you are looking for does not exist or has not been deployed yet. Please check the URL and try again.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Create Your Own Site
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">
                        Powered by AI Landing Page Builder
                    </p>
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


    return <PreviewClient files={sanitizedFiles} />;
}
