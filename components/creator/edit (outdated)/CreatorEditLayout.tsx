import { ReactNode } from "react";

interface CreatorEditLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function CreatorEditLayout({
  children,
  title = "Edit Creator",
  description = "Manage creator profile information and settings.",
}: CreatorEditLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        
        <div className="space-y-2 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="max-w-2xl text-sm text-zinc-400">
            {description}
          </p>
        </div>

        <div className="grid gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}