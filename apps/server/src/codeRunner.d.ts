export type ExecutionResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
    runtimeMs: number;
    timedOut: boolean;
};
export declare function runCode(code: string, language: string, timeoutMs?: number, stdin?: string): Promise<ExecutionResult>;
//# sourceMappingURL=codeRunner.d.ts.map