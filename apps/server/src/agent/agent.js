import { generatePatch, } from "./patchGenerator.js";
function normalizeLanguage(language) {
    const value = language.trim().toLowerCase();
    if (value === "py" ||
        value === "python3") {
        return "python";
    }
    if (value === "js" ||
        value === "jsx" ||
        value === "node") {
        return "javascript";
    }
    if (value === "ts" ||
        value === "tsx") {
        return "typescript";
    }
    if (value === "c++") {
        return "cpp";
    }
    return value;
}
function createGeneralAnalysis(code, language, question) {
    const issues = [];
    const normalized = normalizeLanguage(language);
    const lines = code.split("\n");
    if (!code.trim()) {
        issues.push({
            type: "error",
            title: "Empty source code",
            description: "The source file does not contain executable code.",
        });
        return issues;
    }
    if (normalized === "python") {
        const functionMatch = code.match(/^\s*def\s+([a-zA-Z_]\w*)\s*\(/m);
        if (functionMatch?.[1]) {
            const functionName = functionMatch[1];
            const functionBody = code.substring(functionMatch.index ?? 0);
            if (!/\breturn\b/.test(functionBody) &&
                (question
                    .toLowerCase()
                    .includes("return") ||
                    /add|sum|multiply|product|square|max|min|factorial|search/i.test(functionName))) {
                const line = getLineNumber(code, functionMatch.index ?? 0);
                const issue = {
                    type: "warning",
                    title: "Possible missing return statement",
                    description: `The function "${functionName}" may calculate a value without returning it.`,
                };
                if (line !== undefined) {
                    issue.line = line;
                }
                issues.push(issue);
            }
        }
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? "";
            if (line.trim().startsWith("def ") &&
                !line.includes(":")) {
                issues.push({
                    type: "error",
                    title: "Invalid function declaration",
                    description: "The Python function declaration appears to be missing ':'.",
                    line: i + 1,
                });
            }
        }
    }
    if (normalized === "javascript" ||
        normalized === "typescript") {
        const open = (code.match(/{/g) || [])
            .length;
        const close = (code.match(/}/g) || [])
            .length;
        if (open !== close) {
            issues.push({
                type: "error",
                title: "Unbalanced curly braces",
                description: "The number of opening and closing curly braces does not match.",
            });
        }
        if (/\bvar\s+/.test(code)) {
            issues.push({
                type: "warning",
                title: "Use let or const",
                description: "Prefer let or const instead of var for modern JavaScript and TypeScript code.",
            });
        }
    }
    return issues;
}
function detectLikelyLogicIssues(code, language) {
    const issues = [];
    const normalized = normalizeLanguage(language);
    if (normalized === "python" ||
        normalized === "javascript" ||
        normalized === "typescript") {
        const addPattern = /\b(add|sum|addition)\b/i;
        const multiplyPattern = /\b(multiply|multiplication|product)\b/i;
        if (addPattern.test(code) &&
            /return\s+[\w\[\].]+\s*-\s*[\w\[\].]+/i.test(code)) {
            const line = findLine(code, /return\s+[\w\[\].]+\s*-\s*[\w\[\].]+/i);
            const issue = {
                type: "error",
                title: "Possible incorrect addition logic",
                description: "The function name suggests addition or summation, but the return expression uses subtraction.",
            };
            if (line !== undefined) {
                issue.line = line;
            }
            issues.push(issue);
        }
        if (multiplyPattern.test(code) &&
            /return\s+[\w\[\].]+\s*\+\s*[\w\[\].]+/i.test(code)) {
            const line = findLine(code, /return\s+[\w\[\].]+\s*\+\s*[\w\[\].]+/i);
            const issue = {
                type: "error",
                title: "Possible incorrect multiplication logic",
                description: "The function name suggests multiplication, but the return expression uses addition.",
            };
            if (line !== undefined) {
                issue.line = line;
            }
            issues.push(issue);
        }
    }
    if (/\/\s*0\b/.test(code)) {
        const line = findLine(code, /\/\s*0\b/);
        const issue = {
            type: "error",
            title: "Division by zero",
            description: "The code contains a division operation whose denominator appears to be zero.",
        };
        if (line !== undefined) {
            issue.line = line;
        }
        issues.push(issue);
    }
    return issues;
}
function deduplicateIssues(issues) {
    const seen = new Set();
    const result = [];
    for (const issue of issues) {
        const key = [
            issue.type,
            issue.title,
            issue.line ?? 0,
        ].join("|");
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(issue);
    }
    return result;
}
function buildExplanation(issues, language) {
    if (issues.length === 0) {
        return (`SmartLab analyzed the ${normalizeLanguage(language)} source and did not detect a strong candidate for an automatic correction.`);
    }
    const errors = issues.filter((issue) => issue.type === "error").length;
    const warnings = issues.filter((issue) => issue.type === "warning").length;
    const parts = [];
    if (errors > 0) {
        parts.push(`${errors} error candidate${errors === 1 ? "" : "s"}`);
    }
    if (warnings > 0) {
        parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
    }
    return `SmartLab found ${parts.join(" and ")}. The automatic patch is based on the detected source pattern and must be verified with execution tests before applying it.`;
}
function shouldGeneratePatch(question, issues) {
    const text = question.trim().toLowerCase();
    if (text.includes("fix") ||
        text.includes("correct") ||
        text.includes("repair") ||
        text.includes("solve") ||
        text.includes("apply")) {
        return true;
    }
    return issues.some((issue) => issue.type === "error");
}
function getLineNumber(code, index) {
    return (code
        .slice(0, index)
        .split("\n").length);
}
function findLine(code, pattern) {
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        if (pattern.test(line)) {
            return i + 1;
        }
    }
    return undefined;
}
export async function runAgent(request) {
    const code = typeof request.code === "string"
        ? request.code
        : "";
    const language = typeof request.language === "string"
        ? request.language
        : "python";
    const question = typeof request.question === "string"
        ? request.question
        : "";
    const suppliedIssues = Array.isArray(request.issues)
        ? request.issues
        : [];
    if (!code.trim()) {
        return {
            success: false,
            message: "No source code was provided.",
            analysis: {
                summary: "SmartLab cannot analyze an empty source file.",
                issues: [
                    {
                        type: "error",
                        title: "Empty source code",
                        description: "Provide source code before asking SmartLab to review or fix it.",
                    },
                ],
                suggestions: [
                    "Add executable code to the file.",
                ],
                explanation: "There is no code available for analysis.",
            },
            patch: null,
        };
    }
    const detectedIssues = createGeneralAnalysis(code, language, question);
    const logicIssues = detectLikelyLogicIssues(code, language);
    const allIssues = deduplicateIssues([
        ...suppliedIssues,
        ...detectedIssues,
        ...logicIssues,
    ]);
    const suggestions = [];
    for (const issue of allIssues) {
        if (issue.type === "error") {
            suggestions.push(`Fix "${issue.title}" before applying the code.`);
        }
        if (issue.type === "warning") {
            suggestions.push(`Review "${issue.title}" and confirm that the current behavior is intentional.`);
        }
    }
    if (suggestions.length === 0) {
        suggestions.push("Run the code with representative edge cases.", "Review the algorithm's time and space complexity.", "Verify the output against the expected behavior.");
    }
    let patch = null;
    if (shouldGeneratePatch(question, allIssues)) {
        patch =
            generatePatch(code, language, allIssues);
    }
    const summary = allIssues.length === 0
        ? "No strong code defect was detected by the current SmartLab analysis."
        : `${allIssues.length} potential issue${allIssues.length === 1
            ? ""
            : "s"} detected in the source code.`;
    return {
        success: true,
        message: patch?.success
            ? "SmartLab analyzed the code and generated a candidate fix."
            : "SmartLab analyzed the code successfully.",
        analysis: {
            summary,
            issues: allIssues,
            suggestions,
            explanation: buildExplanation(allIssues, language),
        },
        patch,
    };
}
//# sourceMappingURL=agent.js.map