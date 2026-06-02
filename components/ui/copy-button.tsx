"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

type CopyButtonProps = {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CopyButton({ text, label = "复制", size = "sm", className }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual" | "error">("idle");

  async function handleCopy() {
    let cleanupManualSelection: (() => void) | undefined;

    try {
      const result = await copyToClipboard(text);

      if (result.status === "manual") {
        cleanupManualSelection = result.cleanup;
        setStatus("manual");
      } else {
        setStatus("copied");
      }
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => {
      cleanupManualSelection?.();
      setStatus("idle");
    }, cleanupManualSelection ? 3000 : 1600);
  }

  const copied = status === "copied";
  const manual = status === "manual";
  const failed = status === "error";

  return (
    <Button
      type="button"
      variant={copied ? "warm" : "secondary"}
      size={size}
      onClick={handleCopy}
      className={className}
      aria-live="polite"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "已复制" : manual ? "请按 Ctrl+C" : failed ? "复制失败" : label}
    </Button>
  );
}

async function copyToClipboard(text: string) {
  if (copyWithTextareaFallback(text)) {
    return { status: "copied" as const };
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { status: "copied" as const };
    }
  } catch {
    // Some browsers deny Clipboard API access on local or protected pages.
  }

  return { status: "manual" as const, cleanup: selectTextForManualCopy(text) };
}

function copyWithTextareaFallback(text: string) {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function selectTextForManualCopy(text: string) {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "0";
  textarea.style.top = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  return () => {
    if (textarea.parentNode) {
      document.body.removeChild(textarea);
    }
  };
}
