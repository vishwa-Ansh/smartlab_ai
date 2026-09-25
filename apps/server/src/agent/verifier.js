import { runProgramTests } from "../testRunner.js";
export async function verifyPatch(originalCode, fixedCode, language, testCases) {
    if (!fixedCode.trim()) {
        return {
            verified: false,
            reason: "Generated fixed code is empty.",
            passed: 0,
            total: testCases.length,
            cases: [],
        };
    }
    if (fixedCode === originalCode) {
        return {
            verified: false,
            reason: "No code change was generated.",
            passed: 0,
            total: testCases.length,
            cases: [],
        };
    }
    if (!Array.isArray(testCases) ||
        testCases.length === 0) {
        return {
            verified: false,
            reason: "No verification test cases were available.",
            passed: 0,
            total: 0,
            cases: [],
        };
    }
    try {
        const result = await runProgramTests(fixedCode, language, testCases);
        const cases = result.cases.map((test) => ({
            name: test.name,
            input: test.input,
            expected: test.expected,
            actual: test.actual,
            status: test.status,
        }));
        const verified = result.total > 0 &&
            result.passed ===
                result.total;
        return {
            verified,
            reason: verified
                ? "All verification tests passed with the generated patch."
                : "The generated patch failed one or more verification tests.",
            passed: result.passed,
            total: result.total,
            cases,
        };
    }
    catch (error) {
        return {
            verified: false,
            reason: error instanceof Error
                ? error.message
                : "Patch verification failed.",
            passed: 0,
            total: testCases.length,
            cases: [],
        };
    }
}
//# sourceMappingURL=verifier.js.map