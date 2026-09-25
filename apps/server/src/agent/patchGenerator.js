function normalizeLanguage(language) {
    const value = language.trim().toLowerCase();
    if (value === "py" || value === "python3") {
        return "python";
    }
    if (value === "js" || value === "jsx" || value === "node") {
        return "javascript";
    }
    if (value === "ts" || value === "tsx") {
        return "typescript";
    }
    if (value === "c++") {
        return "cpp";
    }
    return value;
}
function replaceLine(lines, lineNumber, replacement) {
    const index = lineNumber - 1;
    if (index < 0 || index >= lines.length) {
        return null;
    }
    const oldCode = lines[index] ?? "";
    lines[index] = replacement;
    return {
        oldCode,
        newCode: replacement,
    };
}
function findLine(code, pattern) {
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
            return i + 1;
        }
    }
    return undefined;
}
function fixAdditionLogic(lines, originalCode, changes) {
    const lineNumber = findLine(originalCode, /return\s+([A-Za-z_][\w.[\]]*)\s*-\s*([A-Za-z_][\w.[\]]*)/);
    if (!lineNumber) {
        return false;
    }
    const index = lineNumber - 1;
    const current = lines[index] ?? "";
    const replacement = current.replace(/(\S+)\s*-\s*(\S+)/, "$1 + $2");
    if (replacement === current) {
        return false;
    }
    const result = replaceLine(lines, lineNumber, replacement);
    if (!result) {
        return false;
    }
    changes.push({
        line: lineNumber,
        oldCode: result.oldCode,
        newCode: result.newCode,
        reason: "The function appears to perform addition, but the return expression used subtraction.",
    });
    return true;
}
function fixMultiplicationLogic(lines, originalCode, changes) {
    const lineNumber = findLine(originalCode, /return\s+([A-Za-z_][\w.[\]]*)\s*\+\s*([A-Za-z_][\w.[\]]*)/);
    if (!lineNumber) {
        return false;
    }
    const index = lineNumber - 1;
    const current = lines[index] ?? "";
    const replacement = current.replace(/(\S+)\s*\+\s*(\S+)/, "$1 * $2");
    if (replacement === current) {
        return false;
    }
    const result = replaceLine(lines, lineNumber, replacement);
    if (!result) {
        return false;
    }
    changes.push({
        line: lineNumber,
        oldCode: result.oldCode,
        newCode: result.newCode,
        reason: "The function appears to perform multiplication, but the return expression used addition.",
    });
    return true;
}
function fixDivisionByZero(lines, originalCode, changes) {
    const lineNumber = findLine(originalCode, /\/\s*0\b/);
    if (!lineNumber) {
        return false;
    }
    const index = lineNumber - 1;
    const current = lines[index] ?? "";
    const replacement = current.replace(/\/\s*0\b/g, "/ 1");
    if (replacement === current) {
        return false;
    }
    const result = replaceLine(lines, lineNumber, replacement);
    if (!result) {
        return false;
    }
    changes.push({
        line: lineNumber,
        oldCode: result.oldCode,
        newCode: result.newCode,
        reason: "A division by zero was detected. The generated patch prevents the literal zero denominator.",
    });
    return true;
}
function fixMissingPythonReturn(lines, issues, changes) {
    const issue = issues.find((item) => item.title ===
        "Possible missing return statement");
    if (!issue || issue.line === undefined) {
        return false;
    }
    const functionIndex = issue.line - 1;
    if (functionIndex < 0 ||
        functionIndex >= lines.length) {
        return false;
    }
    let endIndex = functionIndex + 1;
    while (endIndex < lines.length) {
        const current = lines[endIndex] ?? "";
        if (current.trim() &&
            !/^\s/.test(current)) {
            break;
        }
        endIndex++;
    }
    const bodyLines = lines.slice(functionIndex + 1, endIndex);
    const assignmentIndex = bodyLines.findIndex((line) => /^\s*[A-Za-z_]\w*\s*=/.test(line));
    if (assignmentIndex === -1) {
        return false;
    }
    const actualIndex = functionIndex +
        1 +
        assignmentIndex;
    const assignment = lines[actualIndex] ?? "";
    const match = assignment.match(/^(\s*)([A-Za-z_]\w*)\s*=/);
    if (!match?.[2]) {
        return false;
    }
    const variable = match[2];
    const indentation = match[1] ?? "    ";
    const returnLine = `${indentation}return ${variable}`;
    lines.splice(actualIndex + 1, 0, returnLine);
    changes.push({
        line: actualIndex + 2,
        oldCode: "",
        newCode: returnLine,
        reason: "A calculated value was detected without a return statement.",
    });
    return true;
}
export function generatePatch(originalCode, language, issues = []) {
    const normalizedLanguage = normalizeLanguage(language);
    const lines = originalCode.split("\n");
    const changes = [];
    let changed = false;
    const hasAdditionIssue = issues.some((issue) => issue.title
        .toLowerCase()
        .includes("addition") ||
        issue.description
            .toLowerCase()
            .includes("uses subtraction") ||
        issue.description
            .toLowerCase()
            .includes("subtraction"));
    const hasMultiplicationIssue = issues.some((issue) => issue.title
        .toLowerCase()
        .includes("multiplication") ||
        issue.description
            .toLowerCase()
            .includes("uses addition"));
    const hasDivisionIssue = issues.some((issue) => issue.title
        .toLowerCase()
        .includes("division by zero") ||
        issue.description
            .toLowerCase()
            .includes("division by zero"));
    if (hasAdditionIssue ||
        /\b(add|sum|addition)\b/i.test(originalCode)) {
        if (fixAdditionLogic(lines, originalCode, changes)) {
            changed = true;
        }
    }
    if (hasMultiplicationIssue ||
        /\b(multiply|multiplication|product)\b/i.test(originalCode)) {
        if (fixMultiplicationLogic(lines, originalCode, changes)) {
            changed = true;
        }
    }
    if (hasDivisionIssue ||
        /\/\s*0\b/.test(originalCode)) {
        if (fixDivisionByZero(lines, originalCode, changes)) {
            changed = true;
        }
    }
    if (normalizedLanguage === "python") {
        if (fixMissingPythonReturn(lines, issues, changes)) {
            changed = true;
        }
    }
    const fixedCode = lines.join("\n");
    if (!changed ||
        fixedCode === originalCode) {
        return {
            success: false,
            originalCode,
            fixedCode: originalCode,
            explanation: "SmartLab could not generate a sufficiently reliable automatic correction for the detected issue.",
            changes: [],
        };
    }
    return {
        success: true,
        originalCode,
        fixedCode,
        explanation: "SmartLab generated a candidate patch from the detected code issues. The patch should be executed against verification tests before it is applied.",
        changes,
    };
}
//# sourceMappingURL=patchGenerator.js.map