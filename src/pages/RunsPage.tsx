import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search } from "lucide-react";
import type { Run } from "@/lib/types";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    supabase.from("runs").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setRuns(data));
  }, []);

  const filtered = runs.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Run History</h1>
        <p className="mt-1 text-muted-foreground">All orchestration runs and their results</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search runs..." className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="No runs found" description="Create a run in Console Mode to get started." />
      ) : (
        <div className="space-y-2">
          {filtered.map((run) => (
            <Link key={run.id} to={`/runs/${run.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{run.title}</p>
                  {run.description && <p className="mt-0.5 text-sm text-muted-foreground">{run.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground font-mono">{new Date(run.created_at).toLocaleString()} • {run.mode}</p>
                </div>
                <StatusBadge status={run.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
