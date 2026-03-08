import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import type { PromptTemplate } from "@/lib/types";

const TEMPLATE_TYPES = ["system", "coordinator", "boardroom_moderator", "domain_specialist"];

export default function PromptsPage() {
  const { isAdmin, hasRole } = useAuth();
  const canEdit = isAdmin || hasRole("analyst");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromptTemplate | null>(null);

  const loadData = () => {
    supabase.from("prompt_templates").select("*").order("template_type").then(({ data }) => data && setTemplates(data));
  };

  useEffect(() => { loadData(); }, []);

  const saveTemplate = async (t: Partial<PromptTemplate> & { id?: string }) => {
    if (t.id) {
      const { error } = await supabase.from("prompt_templates").update({ name: t.name, content: t.content, template_type: t.template_type, enabled: t.enabled }).eq("id", t.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("prompt_templates").insert({ name: t.name!, content: t.content!, template_type: t.template_type! });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Template saved");
    setDialogOpen(false);
    setEditing(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-gold" />
            Prompt Library
          </h1>
          <p className="mt-1 text-muted-foreground">Reusable prompt templates for orchestration</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)} className="gap-2"><Plus className="h-4 w-4" /> New Template</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
              <TemplateForm template={editing} onSave={saveTemplate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{t.name}</h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground capitalize">{t.template_type.replace(/_/g, " ")}</span>
                <span className="text-xs text-muted-foreground font-mono">v{t.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={t.enabled} disabled />
                {canEdit && <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setDialogOpen(true); }}>Edit</Button>}
              </div>
            </div>
            <p className="text-sm text-secondary-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateForm({ template, onSave }: { template: PromptTemplate | null; onSave: (t: any) => void }) {
  const [form, setForm] = useState({
    name: template?.name || "",
    template_type: template?.template_type || "system",
    content: template?.content || "",
    enabled: template?.enabled ?? true,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-muted border-border" />
      </div>
      <div>
        <Label className="text-xs">Type</Label>
        <Select value={form.template_type} onValueChange={(v) => setForm({ ...form, template_type: v })}>
          <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TEMPLATE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Content</Label>
        <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="mt-1 bg-muted border-border text-sm font-mono" />
      </div>
      <Button onClick={() => onSave({ ...form, id: template?.id })} className="w-full gap-2"><Save className="h-4 w-4" /> Save</Button>
    </div>
  );
}
