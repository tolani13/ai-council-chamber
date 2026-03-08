import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  running: "bg-info/20 text-info",
  active: "bg-info/20 text-info",
  completed: "bg-success/20 text-success",
  failed: "bg-destructive/20 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] || statusStyles.draft
      )}
    >
      {status === "running" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-thinking" />}
      {status}
    </span>
  );
}
