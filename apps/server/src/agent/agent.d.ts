import { type CodeIssue, type CodePatch } from "./patchGenerator.js";
export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
};
export type AgentRequest = {
    code: string;
    language: string;
    question?: string;
    issues?: CodeIssue[];
    messages?: AgentMessage[];
};
export type AgentAnalysis = {
    summary: string;
    issues: CodeIssue[];
    suggestions: string[];
    explanation: string;
};
export type AgentResponse = {
    success: boolean;
    message: string;
    analysis: AgentAnalysis;
    patch: CodePatch | null;
};
export declare function runAgent(request: AgentRequest): Promise<AgentResponse>;
//# sourceMappingURL=agent.d.ts.map