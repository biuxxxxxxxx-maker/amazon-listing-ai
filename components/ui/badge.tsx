import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "warm" | "dark" | "green";
};

const toneClass = {
  neutral: "border-line bg-white text-neutral-600",
  warm: "border-orange-200 bg-amberSoft text-[#8a5a1e]",
  dark: "border-ink bg-ink text-white",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function Badge({ className, children, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
