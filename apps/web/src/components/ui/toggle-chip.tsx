import type { ButtonHTMLAttributes } from "react";

/** Pill-shaped pressable chip — chart type/timeframe/indicator toggles, tab bars. */
export function ToggleChip({
  active,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      // A chip given another role (e.g. role="tab" with aria-selected) must not also claim
      // aria-pressed — that attribute isn't allowed on tabs (axe aria-allowed-attr).
      aria-pressed={props.role ? undefined : active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-accent bg-accent/15 text-text-primary"
          : "border-border-default bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      } ${className}`}
      {...props}
    />
  );
}
