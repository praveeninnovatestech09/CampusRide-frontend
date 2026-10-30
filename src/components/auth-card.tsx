import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <div className="animate-rise rounded-3xl border bg-card p-8 shadow-lift">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1.5 mb-7 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
