import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "warm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white shadow-soft hover:bg-black",
  secondary: "border border-line bg-white text-ink hover:border-neutral-300 hover:bg-neutral-50",
  ghost: "text-ink hover:bg-neutral-100",
  warm: "border border-orange-200 bg-amberSoft text-ink hover:bg-orange-100",
};

const sizeClass = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
