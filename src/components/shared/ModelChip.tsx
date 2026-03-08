import { cn } from "@/lib/utils";

interface ModelChipProps {
  name: string;
  colorTag?: string | null;
  seatType?: string | null;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ModelChip({ name, colorTag, seatType, active, onClick, className }: ModelChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
        active
          ? "border-primary/50 bg-primary/10 text-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30",
        onClick && "cursor-pointer",
        className
      )}
    >
      {colorTag && (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colorTag }} />
      )}
      <span className="font-medium">{name}</span>
      {seatType && (
        <span className="text-xs text-muted-foreground/60 capitalize">{seatType}</span>
      )}
    </button>
  );
}
