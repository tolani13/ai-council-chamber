import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search } from "lucide-react";
import type { Meeting } from "@/lib/types";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("meetings").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setMeetings(data));
  }, []);

  const filtered = meetings.filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meeting History</h1>
        <p className="mt-1 text-muted-foreground">All boardroom sessions and deliberations</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings..." className="pl-9 bg-card border-border" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No meetings found" description="Start a boardroom session to see history here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Link key={m.id} to={`/meetings/${m.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:bg-accent/50 transition-colors">
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.topic && <p className="mt-0.5 text-sm text-muted-foreground">{m.topic}</p>}
                  <p className="mt-1 text-xs text-muted-foreground font-mono">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
