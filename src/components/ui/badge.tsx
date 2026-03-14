import { cn } from "@/lib/cn";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--bg-hover)] text-[var(--text-secondary)]",
  accent:
    "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]",
  success:
    "bg-[var(--success)]/15 text-[var(--success)]",
  warning:
    "bg-[var(--warning)]/15 text-[var(--warning)]",
  error:
    "bg-[var(--error)]/15 text-[var(--error)]",
  info:
    "bg-[var(--info)]/15 text-[var(--info)]",
  muted:
    "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
