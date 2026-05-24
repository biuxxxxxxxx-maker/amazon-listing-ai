import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100",
        className,
      )}
      {...props}
    />
  );
}
