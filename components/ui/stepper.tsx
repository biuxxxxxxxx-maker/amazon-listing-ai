import type { WizardStep } from "@/lib/types";
import { cn } from "@/lib/utils";

type StepperProps = {
  steps: WizardStep[];
  currentStep: number;
};

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {steps.map((step, index) => {
        const active = index === currentStep;
        const complete = index < currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "min-w-[15.5rem] rounded-2xl border p-4 transition sm:min-w-0",
              active && "border-ink bg-white shadow-soft",
              complete && "border-neutral-300 bg-white",
              !active && !complete && "border-line bg-white/70",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-xs font-semibold",
                  active && "bg-ink text-white",
                  complete && "bg-neutral-200 text-ink",
                  !active && !complete && "bg-neutral-100 text-neutral-500",
                )}
              >
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
            </div>
            <p className="text-xs leading-5 text-neutral-500">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}
