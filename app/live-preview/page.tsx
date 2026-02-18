'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LivePreview() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <p>No URL provided</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white overflow-hidden">
        <iframe
        src={url}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; web-share"
        />
    </div>
  );
}

export default function LivePreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LivePreview />
    </Suspense>
  );
}
