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
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  const copied = status === "copied";
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
      {copied ? "已复制" : failed ? "复制失败" : label}
    </Button>
  );
}
