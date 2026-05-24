import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-white/86 shadow-hairline backdrop-blur transition duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
