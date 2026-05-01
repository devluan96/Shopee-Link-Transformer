import { useState, useCallback } from "react";

export interface ClipboardState {
  copiedId: string | null;
}

export interface ClipboardActions {
  copyToClipboard: (text: string, id: string) => Promise<void>;
  clearCopied: () => void;
}

export function useClipboard(): ClipboardState & ClipboardActions {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const clearCopied = useCallback(() => {
    setCopiedId(null);
  }, []);

  return {
    copiedId,
    copyToClipboard,
    clearCopied,
  };
}
