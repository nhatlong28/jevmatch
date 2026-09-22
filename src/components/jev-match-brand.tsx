import { Layers3Icon } from "lucide-react";

type JevMatchBrandProps = {
  compact?: boolean;
};

export function JevMatchBrand({ compact = false }: JevMatchBrandProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_rgba(9,103,242,0.9)]"
      >
        <Layers3Icon className="size-4" strokeWidth={2.5} />
      </span>
      {compact ? null : (
        <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">
          Jev Match
        </span>
      )}
    </div>
  );
}
