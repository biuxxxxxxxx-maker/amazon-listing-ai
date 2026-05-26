import type { ReactNode } from "react";
import { Card } from "./card";
import { CopyButton } from "./copy-button";

type ResultBlockProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  description?: string;
  copyText?: string;
  copyLabel?: string;
  children: ReactNode;
};

export function ResultBlock({
  id,
  title,
  eyebrow,
  description,
  copyText,
  copyLabel,
  children,
}: ResultBlockProps) {
  return (
    <Card id={id} className="scroll-mt-24 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">{description}</p>
          ) : null}
        </div>
        {copyText ? (
          <CopyButton text={copyText} label={copyLabel || "复制模块"} className="w-full sm:w-auto" />
        ) : null}
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </Card>
  );
}
