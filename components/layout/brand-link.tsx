import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLinkProps = {
  href?: string;
  className?: string;
};

export function BrandLink({ href = "/", className }: BrandLinkProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 text-lg font-semibold text-ink", className)}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-ink text-xs font-semibold text-white">
        W
      </span>
      Work UP
    </Link>
  );
}
