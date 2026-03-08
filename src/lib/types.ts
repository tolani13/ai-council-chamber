import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type ModelProvider = Database["public"]["Tables"]["model_providers"]["Row"];
export type Model = Database["public"]["Tables"]["models"]["Row"] & {
  model_providers?: ModelProvider;
};
export type PromptTemplate = Database["public"]["Tables"]["prompt_templates"]["Row"];
export type Run = Database["public"]["Tables"]["runs"]["Row"];
export type RunParticipant = Database["public"]["Tables"]["run_participants"]["Row"] & {
  models?: Model;
};
export type Step = Database["public"]["Tables"]["steps"]["Row"];
export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type Turn = Database["public"]["Tables"]["turns"]["Row"];
export type Utterance = Database["public"]["Tables"]["utterances"]["Row"];
export type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export type RunStatus = "draft" | "running" | "completed" | "failed";
export type RunMode = "console" | "boardroom";
export type StepType = "advisor_response" | "coordinator_synthesis" | "moderator_summary" | "system_note";
export type SpeakerType = "user" | "moderator" | "model" | "system";
export type SeatType = "advisor" | "moderator" | "specialist" | "coordinator";

export interface DemoResponse {
  model_key: string;
  output: string;
  latency_ms: number;
}
