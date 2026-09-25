export type CodeIssue = {
    type: "error" | "warning" | "info";
    title: string;
    description: string;
    line?: number;
};
export type CodePatch = {
    success: boolean;
    originalCode: string;
    fixedCode: string;
    explanation: string;
    changes: Array<{
        line: number;
        oldCode: string;
        newCode: string;
        reason: string;
    }>;
};
export declare function generatePatch(originalCode: string, language: string, issues?: CodeIssue[]): CodePatch;
//# sourceMappingURL=patchGenerator.d.ts.map