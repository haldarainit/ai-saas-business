import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI App Builder | Generate React Apps with AI',
  description: 'Clone any website or build new React applications using natural language. Powered by advanced AI models.',
  keywords: ['AI', 'app builder', 'React', 'code generation', 'website cloning'],
};

export default function GenerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
