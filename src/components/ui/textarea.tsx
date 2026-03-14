import { cn } from "@/lib/cn";
import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[80px] resize-y",
            error && "border-[var(--error)]",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--error)]">{error}</span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
