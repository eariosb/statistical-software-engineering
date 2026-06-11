"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type CollapsibleCodeBlockProps = {
  language: string;
  code: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
};

export function CollapsibleCodeBlock({
  language,
  code,
  children,
  defaultCollapsed = true,
}: CollapsibleCodeBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="my-6 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/30 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {language || "code"}
        </span>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-xs text-muted hover:text-text transition-colors"
        >
          {collapsed ? "Mostrar código" : "Ocultar código"}
        </button>
      </div>
      {!collapsed && (
        <div className="overflow-x-auto border-t border-border">
          <pre className="!m-0 !rounded-none !border-0 bg-code-bg !p-4 text-sm leading-relaxed">
            {children}
          </pre>
        </div>
      )}
    </div>
  );
}
