import type { RealTestCase } from "../testRunner.js";
export type VerificationResult = {
    verified: boolean;
    reason: string;
    passed: number;
    total: number;
    cases: Array<{
        name: string;
        input: string;
        expected: string;
        actual: string;
        status: "passed" | "failed";
    }>;
};
export declare function verifyPatch(originalCode: string, fixedCode: string, language: string, testCases: RealTestCase[]): Promise<VerificationResult>;
//# sourceMappingURL=verifier.d.ts.map