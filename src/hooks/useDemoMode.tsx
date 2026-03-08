import { createContext, useContext, useState, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({ isDemoMode: true, toggleDemoMode: () => {} });

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(true);
  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode: () => setIsDemoMode((v) => !v) }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export const useDemoMode = () => useContext(DemoModeContext);

// Demo stub responses
export function generateDemoResponse(modelKey: string, taskPrompt: string): string {
  const responses: Record<string, string> = {
    "chatgpt-4o": `## Analysis from ChatGPT-4o\n\n**Assessment:** Based on the task "${taskPrompt.slice(0, 60)}...", I recommend a structured approach focusing on:\n\n1. **Primary consideration:** Risk mitigation through diversified strategy\n2. **Secondary factor:** Timeline optimization with phased rollout\n3. **Confidence level:** 85%\n\nThe key insight here is that multi-stakeholder alignment will be the critical success factor.`,
    "deepseek-chat": `## DeepSeek Analysis\n\n**Technical Assessment:** Analyzing "${taskPrompt.slice(0, 60)}...":\n\n- **Core finding:** The optimal approach involves parallel execution paths\n- **Risk factors:** Implementation complexity (moderate), resource allocation (low risk)\n- **Recommendation:** Proceed with Option B using an iterative validation framework\n- **Confidence:** 78%`,
    "mistral-large": `## Mistral Strategic Review\n\n**Executive Summary:** For "${taskPrompt.slice(0, 60)}...":\n\nThe analysis reveals three viable pathways. The recommended course prioritizes:\n\n1. Scalability over short-term efficiency\n2. Stakeholder communication cadence\n3. Measurable KPIs at 30/60/90 day intervals\n\n**Risk assessment:** Medium. Mitigation through structured checkpoints.\n**Confidence:** 82%`,
    "aya-expanse-32b": `## Aya Expanse Analysis\n\n**Multilingual & Cultural Context:** Regarding "${taskPrompt.slice(0, 60)}...":\n\n- Consider regional variations in implementation\n- Cultural factors suggest a localized approach\n- **Recommendation:** Adaptive framework with regional customization\n- **Confidence:** 76%`,
    "kimi-2-5": `## Kimi 2.5 Assessment\n\n**Deep Reasoning Output:** On "${taskPrompt.slice(0, 60)}...":\n\n**Key observations:**\n1. Pattern analysis suggests cyclical optimization opportunities\n2. Historical precedent supports a conservative initial approach\n3. Long-context analysis reveals hidden dependencies\n\n**Verdict:** Phased implementation with bi-weekly reassessment\n**Confidence:** 80%`,
  };
  return responses[modelKey] || `## Model Response\n\nAnalysis of "${taskPrompt.slice(0, 60)}..." completed.\n\n**Recommendation:** Further investigation recommended.\n**Confidence:** 70%`;
}

export function generateDemoSynthesis(advisorResponses: string[]): string {
  return `## Consolidated Synthesis — Coordinator\n\n### Consensus Areas\n- All advisors agree on a phased, iterative approach\n- Risk mitigation is universally prioritized\n- Measurable outcomes are essential\n\n### Key Divergences\n- Implementation timeline varies (30-90 day range)\n- Confidence levels span 76-85%\n- Regional vs. universal strategy debate\n\n### Consolidated Recommendation\n**Proceed with phased implementation** using the following framework:\n1. **Phase 1 (Days 1-30):** Foundation and stakeholder alignment\n2. **Phase 2 (Days 31-60):** Pilot execution with regional adaptation\n3. **Phase 3 (Days 61-90):** Scale and optimize based on KPIs\n\n### Risk Assessment\n**Overall risk: MEDIUM**\n- Mitigated through structured checkpoints and adaptive strategy\n\n### Confidence: 83% (weighted average across ${advisorResponses.length} advisors)`;
}
