"use client";

import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg text-text shadow-sm hover:bg-codebg"
      aria-label="Subir"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
