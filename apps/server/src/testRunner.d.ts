export type RealTestCase = {
    name: string;
    input: string;
    expected: string;
};
export type TestCaseResult = {
    name: string;
    input: string;
    expected: string;
    actual: string;
    status: "passed" | "failed";
    runtimeMs: number;
};
export type TestRunResult = {
    passed: number;
    total: number;
    cases: TestCaseResult[];
};
export declare function runPythonTests(code: string, functionName: string, testCases: RealTestCase[]): Promise<TestRunResult>;
export declare function runJavaScriptTests(code: string, functionName: string, testCases: RealTestCase[]): Promise<TestRunResult>;
export declare function runProgramTests(code: string, language: string, testCases: RealTestCase[]): Promise<TestRunResult>;
export declare function runGenericTests(code: string, language: string, testCases: RealTestCase[]): Promise<TestRunResult>;
//# sourceMappingURL=testRunner.d.ts.map