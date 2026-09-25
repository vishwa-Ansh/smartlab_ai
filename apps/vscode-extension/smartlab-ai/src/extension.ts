import * as vscode from "vscode";
import * as https from "https";
import * as http from "http";

const API_URL = "http://localhost:4000";

type ReviewResponse = {
  success: boolean;
  submissionId?: string;
  message?: string;
};

type Issue = {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  line?: number;
};

type ReviewData = {
  success: boolean;
  submission?: {
    id: string;
    code: string;
    language: string;
    fileName: string;
    createdAt: string;
    score: number;
    syntax: {
      status: "passed" | "failed";
      message: string;
    };
    tests: {
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
    complexity: {
      time: string;
      space: string;
      explanation: string;
    };
    issues: Issue[];
    metrics: {
      lines: number;
      codeLines: number;
      functions: number;
      comments: number;
    };
    aiReview: string[];
  };
  message?: string;
};

type AgentChange = {
  line: number;
  oldCode: string;
  newCode: string;
  reason: string;
};

type AgentPatch = {
  success: boolean;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  changes: AgentChange[];
};

type AgentAnalysis = {
  language: string;
  issueCount: number;
  issues: Issue[];
};

type VerificationCase = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: "passed" | "failed";
};

type AgentVerification = {
  verified: boolean;
  reason: string;
  passed: number;
  total: number;
  cases: VerificationCase[];
};

type AgentResponse = {
  success: boolean;
  message: string;
  analysis: AgentAnalysis;
  patch?: AgentPatch;
  verification?: AgentVerification;
  actions: string[];
};

function httpRequest(
  url: string,
  options: {
    method?: string;
    body?: string;
  } = {}
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const lib =
      parsed.protocol === "https:"
        ? https
        : http;

    const body = options.body || "";

    const reqOptions = {
      hostname: parsed.hostname,
      port:
        parsed.port ||
        (parsed.protocol === "https:" ? 443 : 80),
      path:
        parsed.pathname +
        parsed.search,
      method:
        options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(body
          ? {
              "Content-Length":
                Buffer.byteLength(body),
            }
          : {}),
      },
    };

    const req = lib.request(
      reqOptions,
      (res) => {
        let data = "";

        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const statusCode =
            res.statusCode || 200;

          if (
            statusCode < 200 ||
            statusCode >= 300
          ) {
            try {
              const parsedError =
                JSON.parse(data);

              console.error(
                "SmartLab BACKEND ERROR:",
                JSON.stringify(parsedError, null, 2)
              );

              const detailParts = [
                parsedError.message,
                parsedError.analysis?.summary,
                parsedError.analysis?.explanation,
                parsedError.patch
                  ? `Patch generated: ${
                      parsedError.patch.success ? "yes" : "no"
                    }`
                  : "Patch generated: no",
                parsedError.verification
                  ? `Verification: ${
                      parsedError.verification.verified
                        ? "passed"
                        : "failed"
                    } (${
                      parsedError.verification.passed
                    }/${
                      parsedError.verification.total
                    })`
                  : "Verification: not available",
              ].filter(Boolean);

              reject(
                new Error(
                  detailParts.length > 0
                    ? detailParts.join("\n")
                    : `HTTP ${statusCode}`
                )
              );
            } catch {
              console.error(
                "SmartLab BACKEND ERROR RAW:",
                data
              );

              reject(
                new Error(
                  `HTTP ${statusCode}: ${
                    data || "Request failed"
                  }`
                )
              );
            }

            return;
          }

          try {
            resolve(
              data
                ? JSON.parse(data)
                : {}
            );
          } catch {
            reject(
              new Error(
                "Invalid JSON response from SmartLab backend."
              )
            );
          }
        });
      }
    );

    req.on("error", reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

export function activate(
  context: vscode.ExtensionContext
) {
  console.log(
    "SmartLab AI activated"
  );

  const provider =
    new SmartLabAgentProvider(
      context
    );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "smartlab.agent",
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "smartlab-ai.reviewCode",
      async () => {
        await reviewCurrentFile(
          provider
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "smartlab-ai.fixCode",
      async () => {
        await fixCurrentFile(
          provider
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "smartlab-ai.applyFix",
      async () => {
        await provider.applyFix();
      }
    )
  );
}

async function reviewCurrentFile(
  provider: SmartLabAgentProvider
) {
  const editor =
    vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage(
      "SmartLab: Open a code file first."
    );
    return;
  }

  const document =
    editor.document;

  const code =
    document.getText();

  if (!code.trim()) {
    vscode.window.showWarningMessage(
      "SmartLab: Current file is empty."
    );
    return;
  }

  const language =
    getLanguage(
      document.languageId
    );

  const fileName =
    document.fileName.split("/").pop() ||
    "unknown";

  provider.setStatus(
    "Sending code to SmartLab..."
  );

  try {
    const data =
      (await httpRequest(
        `${API_URL}/api/review`,
        {
          method: "POST",
          body: JSON.stringify({
            code,
            language,
            fileName,
          }),
        }
      )) as ReviewResponse;

    if (
      !data.success ||
      !data.submissionId
    ) {
      throw new Error(
        data.message ||
          "Review failed."
      );
    }

    provider.setReview({
      submissionId:
        data.submissionId,
      fileName,
      language,
    });

    await provider.loadReview();

    vscode.window.showInformationMessage(
      "SmartLab: Code review completed."
    );
  } catch (error) {
    console.error(
      "SmartLab review error:",
      error
    );

    provider.setStatus(
      "Backend connection failed."
    );

    vscode.window.showErrorMessage(
      error instanceof Error
        ? `SmartLab: ${error.message}`
        : "SmartLab: Backend not reachable. Start the server on port 4000."
    );
  }
}

async function fixCurrentFile(
  provider: SmartLabAgentProvider
) {
  await provider.fixCurrentFile();
}

function getLanguage(
  languageId: string
): string {
  const map: Record<
    string,
    string
  > = {
    javascript: "javascript",
    typescript: "typescript",
    javascriptreact:
      "javascript",
    typescriptreact:
      "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    "c++": "cpp",
  };

  return (
    map[languageId] ||
    languageId ||
    "unknown"
  );
}

class SmartLabAgentProvider
  implements vscode.WebviewViewProvider
{
  private view:
    | vscode.WebviewView
    | undefined;

  private review:
    | {
        submissionId: string;
        fileName: string;
        language: string;
      }
    | undefined;

  private currentIssues: Issue[] =
    [];

  private pendingPatch:
    | AgentPatch
    | undefined;

  private verification:
    | AgentVerification
    | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html =
      this.getHtml();

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (
            message.command
          ) {
            case "review":
              await reviewCurrentFile(
                this
              );
              break;

            case "fix":
              await this.fixCurrentFile();
              break;

            case "applyFix":
              await this.applyFix();
              break;

            case "rejectFix":
              this.rejectFix();
              break;

            case "ask":
              await this.askAgent(
                String(
                  message.question || ""
                )
              );
              break;

            case "openWebReview":
              this.openWebReview();
              break;

            case "refresh":
              await this.loadReview();
              break;
          }
        } catch (error) {
          console.error(
            "SmartLab webview action error:",
            error
          );

          this.setStatus(
            error instanceof Error
              ? error.message
              : "SmartLab action failed."
          );
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  setStatus(
    status: string
  ) {
    this.send({
      command: "status",
      status,
    });
  }

  setReview(
    review: {
      submissionId: string;
      fileName: string;
      language: string;
    }
  ) {
    this.review = review;

    this.send({
      command: "reviewCreated",
      review,
    });
  }

  async loadReview() {
    if (!this.review) {
      return;
    }

    this.setStatus(
      "Loading review..."
    );

    try {
      const data =
        (await httpRequest(
          `${API_URL}/api/review/${this.review.submissionId}`
        )) as ReviewData;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to load review."
        );
      }

      const issues =
        data.submission?.issues ||
        [];

      this.currentIssues =
        issues;

      this.send({
        command: "reviewData",
        data,
      });

      this.setStatus(
        "Review ready"
      );
    } catch (error) {
      console.error(
        "SmartLab load review error:",
        error
      );

      this.setStatus(
        error instanceof Error
          ? error.message
          : "Unable to load review."
      );
    }
  }

  async fixCurrentFile(autoApply = true) {
    const editor =
      vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage(
        "SmartLab: Open a code file first."
      );
      return;
    }

    const document =
      editor.document;

    const code =
      document.getText();

    if (!code.trim()) {
      vscode.window.showWarningMessage(
        "SmartLab: Current file is empty."
      );
      return;
    }

    const language =
      getLanguage(
        document.languageId
      );

    this.setStatus(
      "SmartLab agent is analyzing and generating a fix..."
    );

    try {
      const payload = {
        code,
        language,
        issues: this.currentIssues,
      };

      console.log(
        "SmartLab FIX REQUEST:",
        JSON.stringify(payload, null, 2)
      );

      const data =
        (await httpRequest(
          `${API_URL}/api/agent/fix`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        )) as AgentResponse;

      console.log(
        "SmartLab FIX RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "SmartLab could not generate a fix."
        );
      }

      if (!data.patch) {
        throw new Error(
          "SmartLab did not generate a patch."
        );
      }

      this.pendingPatch =
        data.patch;

      this.verification =
        data.verification;

      this.send({
        command: "agentFix",
        data,
      });

      if (
        data.verification?.verified
      ) {
        this.setStatus(
          autoApply
            ? "Fix verified. Applying to the current VS Code file..."
            : "Fix generated and verified."
        );

        if (autoApply) {
          await this.applyFix(true);
        }
      } else {
        this.setStatus(
          "Fix generated. Verification did not pass, so the file was not changed."
        );
      }
    } catch (error) {
      console.error(
        "SmartLab fix error:",
        error
      );

      this.setStatus(
        error instanceof Error
          ? error.message
          : "Fix generation failed."
      );

      vscode.window.showErrorMessage(
        error instanceof Error
          ? `SmartLab: ${error.message}`
          : "SmartLab: Fix generation failed."
      );
    }
  }

  async askAgent(
    question: string
  ) {
    const editor =
      vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage(
        "SmartLab: Open a code file first."
      );
      return;
    }

    if (!question.trim()) {
      return;
    }

    const code =
      editor.document.getText();

    const language =
      getLanguage(
        editor.document.languageId
      );

    this.setStatus(
      "SmartLab agent is thinking..."
    );

    try {
      const data =
        (await httpRequest(
          `${API_URL}/api/agent`,
          {
            method: "POST",
            body: JSON.stringify({
              code,
              language,
              question,
              issues:
                this.currentIssues,
            }),
          }
        )) as AgentResponse;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Agent request failed."
        );
      }

      this.send({
        command: "agentAnswer",
        data,
      });

      if (data.patch) {
        this.pendingPatch =
          data.patch;
      }

      this.setStatus(
        "Agent response ready"
      );
    } catch (error) {
      console.error(
        "SmartLab agent error:",
        error
      );

      this.setStatus(
        error instanceof Error
          ? error.message
          : "Agent request failed."
      );
    }
  }

  async applyFix(skipConfirmation = false) {
    const patch =
      this.pendingPatch;

    if (!patch) {
      vscode.window.showWarningMessage(
        "SmartLab: No generated fix is available."
      );
      return;
    }

    if (!patch.success) {
      vscode.window.showWarningMessage(
        "SmartLab: The agent did not generate a safe patch."
      );
      return;
    }

    const editor =
      vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage(
        "SmartLab: Open the original file before applying the fix."
      );
      return;
    }

    const currentCode =
      editor.document.getText();

    if (
      currentCode !==
      patch.originalCode
    ) {
      const choice =
        await vscode.window.showWarningMessage(
          "The file has changed since SmartLab generated this patch.",
          "Review Changes",
          "Cancel"
        );

      if (
        choice !==
        "Review Changes"
      ) {
        return;
      }

      await this.showDiff(
        patch.originalCode,
        patch.fixedCode,
        editor.document
          .fileName
      );

      return;
    }

    if (!skipConfirmation) {
      const confirmed =
        await vscode.window.showInformationMessage(
          "SmartLab generated a verified code fix. Apply it to the current file?",
          {
            modal: true,
          },
          "Apply Fix",
          "Cancel"
        );

      if (
        confirmed !==
        "Apply Fix"
      ) {
        return;
      }
    }

    const fullRange =
      new vscode.Range(
        editor.document.positionAt(
          0
        ),
        editor.document.positionAt(
          currentCode.length
        )
      );

    const edit =
      new vscode.WorkspaceEdit();

    edit.replace(
      editor.document.uri,
      fullRange,
      patch.fixedCode
    );

    const applied =
      await vscode.workspace.applyEdit(
        edit
      );

    if (!applied) {
      vscode.window.showErrorMessage(
        "SmartLab: Could not apply the generated fix."
      );
      return;
    }

    await editor.document.save();

    this.setStatus(
      "Fix applied. Re-running review..."
    );

    this.pendingPatch =
      undefined;

    this.verification =
      undefined;

    this.send({
      command: "fixApplied",
    });

    vscode.window.showInformationMessage(
      "SmartLab: Fix applied successfully."
    );

    await reviewCurrentFile(
      this
    );
  }

  rejectFix() {
    this.pendingPatch =
      undefined;

    this.verification =
      undefined;

    this.send({
      command: "fixRejected",
    });

    this.setStatus(
      "Generated fix rejected."
    );
  }

  private async showDiff(
    originalCode: string,
    fixedCode: string,
    fileName: string
  ) {
    const originalUri =
      vscode.Uri.parse(
        `untitled:SmartLab Original ${Date.now()}`
      );

    const fixedUri =
      vscode.Uri.parse(
        `untitled:SmartLab Fixed ${Date.now()}`
      );

    const originalDocument =
      await vscode.workspace.openTextDocument(
        originalUri
      );

    const fixedDocument =
      await vscode.workspace.openTextDocument(
        fixedUri
      );

    const originalEdit =
      new vscode.WorkspaceEdit();

    originalEdit.insert(
      originalUri,
      new vscode.Position(
        0,
        0
      ),
      originalCode
    );

    const fixedEdit =
      new vscode.WorkspaceEdit();

    fixedEdit.insert(
      fixedUri,
      new vscode.Position(
        0,
        0
      ),
      fixedCode
    );

    await vscode.workspace.applyEdit(
      originalEdit
    );

    await vscode.workspace.applyEdit(
      fixedEdit
    );

    await vscode.commands.executeCommand(
      "vscode.diff",
      originalDocument.uri,
      fixedDocument.uri,
      `SmartLab Fix: ${fileName}`
    );
  }

  private openWebReview() {
    if (!this.review) {
      vscode.window.showWarningMessage(
        "SmartLab: Review code first."
      );
      return;
    }

    vscode.env.openExternal(
      vscode.Uri.parse(
        `http://localhost:3000/review/${this.review.submissionId}`
      )
    );
  }

  private send(
    message: unknown
  ) {
    this.view?.webview.postMessage(
      message
    );
  }

  private getHtml(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"
/>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 14px;
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
}

.title {
  font-size: 15px;
  font-weight: 600;
}

.subtitle {
  margin-top: 2px;
  font-size: 11px;
  opacity: .6;
}

.card {
  padding: 13px;
  margin-bottom: 11px;
  border-radius: 10px;
  border: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.description {
  font-size: 11px;
  line-height: 1.5;
  opacity: .7;
  margin-bottom: 12px;
}

button {
  width: 100%;
  padding: 9px 11px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
}

button:hover {
  background:
    var(--vscode-button-hoverBackground);
}

button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

button.secondary {
  margin-top: 7px;
  color: var(--vscode-foreground);
  background:
    var(--vscode-input-background);
  border:
    1px solid var(--vscode-panel-border);
}

button.success-button {
  margin-top: 7px;
  background:
    var(--vscode-testing-iconPassed);
  color: #ffffff;
}

button.danger-button {
  margin-top: 7px;
  background:
    var(--vscode-testing-iconFailed);
  color: #ffffff;
}

.status {
  margin-top: 9px;
  font-size: 10px;
  opacity: .65;
  line-height: 1.4;
}

.hidden {
  display: none !important;
}

.score {
  font-size: 28px;
  font-weight: 700;
  margin: 7px 0;
}

.success {
  color:
    var(--vscode-testing-iconPassed);
}

.error {
  color:
    var(--vscode-testing-iconFailed);
}

.warning {
  color:
    var(--vscode-editorWarning-foreground);
}

.info {
  color:
    var(--vscode-textLink-foreground);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom:
    1px solid var(--vscode-panel-border);
  font-size: 10px;
}

.row:last-child {
  border-bottom: none;
}

.label {
  opacity: .55;
}

.value {
  text-align: right;
  font-weight: 600;
}

.issue {
  padding: 9px;
  margin-top: 7px;
  border-radius: 7px;
  background:
    var(--vscode-textCodeBlock-background);
}

.issue-title {
  font-size: 11px;
  font-weight: 600;
}

.issue-description {
  margin-top: 4px;
  font-size: 10px;
  line-height: 1.4;
  opacity: .7;
}

.ai {
  padding: 8px 0;
  font-size: 10px;
  line-height: 1.5;
  border-bottom:
    1px solid var(--vscode-panel-border);
}

.ai:last-child {
  border-bottom: none;
}

.fix-box {
  padding: 10px;
  margin-top: 8px;
  border-radius: 8px;
  background:
    var(--vscode-textCodeBlock-background);
}

.fix-title {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.fix-description {
  font-size: 10px;
  line-height: 1.5;
  opacity: .75;
}

.change {
  margin-top: 8px;
  padding: 8px;
  border-radius: 6px;
  background:
    var(--vscode-editor-background);
  border:
    1px solid var(--vscode-panel-border);
}

.change-line {
  font-size: 9px;
  opacity: .55;
  margin-bottom: 5px;
}

.old-code {
  color:
    var(--vscode-testing-iconFailed);
  font-family: monospace;
  font-size: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.new-code {
  color:
    var(--vscode-testing-iconPassed);
  font-family: monospace;
  font-size: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 4px;
}

.reason {
  font-size: 9px;
  opacity: .6;
  margin-top: 5px;
  line-height: 1.4;
}

.verify {
  margin-top: 8px;
  padding: 8px;
  border-radius: 7px;
}

.verify-pass {
  border:
    1px solid var(--vscode-testing-iconPassed);
}

.verify-fail {
  border:
    1px solid var(--vscode-testing-iconFailed);
}

.chat {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.chat input {
  min-width: 0;
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border:
    1px solid var(--vscode-input-border);
  outline: none;
  color: var(--vscode-input-foreground);
  background:
    var(--vscode-input-background);
}

.chat button {
  width: auto;
  padding-left: 12px;
  padding-right: 12px;
}

.agent-answer {
  margin-top: 8px;
  padding: 9px;
  border-radius: 7px;
  background:
    var(--vscode-textCodeBlock-background);
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.test-case {
  padding: 7px 0;
  border-bottom:
    1px solid var(--vscode-panel-border);
  font-size: 9px;
}

.test-case:last-child {
  border-bottom: none;
}

</style>
</head>

<body>

<div class="header">
  <div class="logo">S</div>

  <div>
    <div class="title">
      SmartLab AI
    </div>

    <div class="subtitle">
      Smart Code Review Agent
    </div>
  </div>
</div>

<div class="card">

  <div class="card-title">
    Code Review
  </div>

  <div class="description">
    Analyze the currently opened file,
    detect errors, inspect complexity,
    run tests and generate verified fixes.
  </div>

  <button id="review">
    Review Current Code
  </button>

  <button id="fix" class="secondary">
    Fix Current Code
  </button>

  <button id="web" class="secondary">
    Open Web Review
  </button>

  <div class="status" id="status">
    Ready
  </div>

</div>

<div class="card">

  <div class="card-title">
    Ask SmartLab
  </div>

  <div class="description">
    Ask questions about the currently
    opened source file.
  </div>

  <div class="chat">

    <input
      id="question"
      type="text"
      placeholder="Why is this code failing?"
    />

    <button id="ask">
      Ask
    </button>

  </div>

  <div
    id="agentAnswer"
    class="agent-answer hidden"
  ></div>

</div>

<div
  id="reviewResult"
  class="hidden"
>

  <div class="card">

    <div class="card-title">
      Score
    </div>

    <div
      id="score"
      class="score"
    >
      -
    </div>

  </div>

  <div class="card">

    <div class="card-title">
      Analysis
    </div>

    <div class="row">
      <span class="label">
        File
      </span>

      <span
        id="file"
        class="value"
      >
        -
      </span>
    </div>

    <div class="row">
      <span class="label">
        Language
      </span>

      <span
        id="language"
        class="value"
      >
        -
      </span>
    </div>

    <div class="row">
      <span class="label">
        Syntax
      </span>

      <span
        id="syntax"
        class="value"
      >
        -
      </span>
    </div>

    <div class="row">
      <span class="label">
        Time
      </span>

      <span
        id="time"
        class="value"
      >
        -
      </span>
    </div>

    <div class="row">
      <span class="label">
        Space
      </span>

      <span
        id="space"
        class="value"
      >
        -
      </span>
    </div>

    <div class="row">
      <span class="label">
        Tests
      </span>

      <span
        id="tests"
        class="value"
      >
        -
      </span>
    </div>

  </div>

  <div class="card">

    <div class="card-title">
      Issues
    </div>

    <div id="issues"></div>

  </div>

  <div class="card">

    <div class="card-title">
      AI Review
    </div>

    <div id="aiReview"></div>

  </div>

</div>

<div
  id="fixResult"
  class="card hidden"
>

  <div class="card-title">
    SmartLab Fix
  </div>

  <div
    id="fixExplanation"
    class="fix-description"
  ></div>

  <div id="changes"></div>

  <div
    id="verification"
    class="verify"
  ></div>

  <button
    id="applyFix"
    class="success-button"
  >
    Apply Fix
  </button>

  <button
    id="rejectFix"
    class="danger-button"
  >
    Reject Fix
  </button>

</div>

<script nonce="${nonce}">

const vscode =
  acquireVsCodeApi();

const reviewBtn =
  document.getElementById(
    "review"
  );

const fixBtn =
  document.getElementById(
    "fix"
  );

const webBtn =
  document.getElementById(
    "web"
  );

const askBtn =
  document.getElementById(
    "ask"
  );

const applyFixBtn =
  document.getElementById(
    "applyFix"
  );

const rejectFixBtn =
  document.getElementById(
    "rejectFix"
  );

const questionInput =
  document.getElementById(
    "question"
  );

const statusEl =
  document.getElementById(
    "status"
  );

const resultEl =
  document.getElementById(
    "reviewResult"
  );

const fixResultEl =
  document.getElementById(
    "fixResult"
  );

const agentAnswerEl =
  document.getElementById(
    "agentAnswer"
  );

reviewBtn.addEventListener(
  "click",
  () => {

    reviewBtn.disabled =
      true;

    statusEl.textContent =
      "Reviewing code...";

    vscode.postMessage({
      command:
        "review"
    });
  }
);

fixBtn.addEventListener(
  "click",
  () => {

    fixBtn.disabled =
      true;

    statusEl.textContent =
      "Generating verified fix...";

    vscode.postMessage({
      command:
        "fix"
    });
  }
);

webBtn.addEventListener(
  "click",
  () => {

    vscode.postMessage({
      command:
        "openWebReview"
    });
  }
);

askBtn.addEventListener(
  "click",
  () => {

    const question =
      questionInput.value.trim();

    if (!question) {
      return;
    }

    askBtn.disabled =
      true;

    vscode.postMessage({
      command:
        "ask",
      question
    });
  }
);

questionInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      askBtn.click();
    }
  }
);

applyFixBtn.addEventListener(
  "click",
  () => {

    vscode.postMessage({
      command:
        "applyFix"
    });
  }
);

rejectFixBtn.addEventListener(
  "click",
  () => {

    vscode.postMessage({
      command:
        "rejectFix"
    });
  }
);

window.addEventListener(
  "message",
  (event) => {

    const msg =
      event.data;

    if (
      msg.command ===
      "status"
    ) {

      statusEl.textContent =
        msg.status;

      const status =
        String(
          msg.status || ""
        ).toLowerCase();

      if (
        status.includes(
          "ready"
        ) ||
        status.includes(
          "failed"
        ) ||
        status.includes(
          "unable"
        ) ||
        status.includes(
          "error"
        ) ||
        status.includes(
          "applied"
        ) ||
        status.includes(
          "rejected"
        )
      ) {

        reviewBtn.disabled =
          false;

        fixBtn.disabled =
          false;

        askBtn.disabled =
          false;
      }
    }

    if (
      msg.command ===
      "reviewCreated"
    ) {

      statusEl.textContent =
        "Code submitted. Loading review...";
    }

    if (
      msg.command ===
      "reviewData"
    ) {

      reviewBtn.disabled =
        false;

      fixBtn.disabled =
        false;

      const data =
        msg.data;

      if (
        !data ||
        !data.submission
      ) {
        return;
      }

      const r =
        data.submission;

      resultEl.classList.remove(
        "hidden"
      );

      document.getElementById(
        "score"
      ).textContent =
        r.score ??
        "-";

      document.getElementById(
        "file"
      ).textContent =
        r.fileName ??
        "-";

      document.getElementById(
        "language"
      ).textContent =
        r.language ??
        "-";

      const syntaxEl =
        document.getElementById(
          "syntax"
        );

      syntaxEl.textContent =
        r.syntax?.status ??
        "-";

      syntaxEl.className =
        "value " +
        (
          r.syntax?.status ===
          "passed"
            ? "success"
            : "error"
        );

      document.getElementById(
        "time"
      ).textContent =
        r.complexity?.time ??
        "-";

      document.getElementById(
        "space"
      ).textContent =
        r.complexity?.space ??
        "-";

      document.getElementById(
        "tests"
      ).textContent =
        (
          r.tests?.passed ??
          0
        ) +
        " / " +
        (
          r.tests?.total ??
          0
        );

      renderIssues(
        r.issues ||
          []
      );

      renderAIReview(
        r.aiReview ||
          []
      );

      statusEl.textContent =
        "Review ready";
    }

    if (
      msg.command ===
      "agentFix"
    ) {

      fixBtn.disabled =
        false;

      renderFix(
        msg.data
      );
    }

    if (
      msg.command ===
      "agentAnswer"
    ) {

      askBtn.disabled =
        false;

      renderAgentAnswer(
        msg.data
      );
    }

    if (
      msg.command ===
      "fixApplied"
    ) {

      fixResultEl.classList.add(
        "hidden"
      );

      fixBtn.disabled =
        false;

      reviewBtn.disabled =
        false;

      statusEl.textContent =
        "Fix applied and review restarted.";
    }

    if (
      msg.command ===
      "fixRejected"
    ) {

      fixResultEl.classList.add(
        "hidden"
      );

      fixBtn.disabled =
        false;

      statusEl.textContent =
        "Generated fix rejected.";
    }
  }
);

function renderIssues(
  issues
) {

  const container =
    document.getElementById(
      "issues"
    );

  container.innerHTML =
    "";

  if (
    !issues.length
  ) {

    container.innerHTML =
      "<div class='status'>No issues detected.</div>";

    return;
  }

  issues.forEach(
    (issue) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "issue";

      div.innerHTML =
        "<div class='issue-title " +
        escapeHtml(
          issue.type
        ) +
        "'>" +
        escapeHtml(
          issue.title
        ) +
        (
          issue.line
            ? " — Line " +
              issue.line
            : ""
        ) +
        "</div>" +
        "<div class='issue-description'>" +
        escapeHtml(
          issue.description
        ) +
        "</div>";

      container.appendChild(
        div
      );
    }
  );
}

function renderAIReview(
  reviews
) {

  const container =
    document.getElementById(
      "aiReview"
    );

  container.innerHTML =
    "";

  if (
    !reviews.length
  ) {

    container.innerHTML =
      "<div class='status'>No AI review available.</div>";

    return;
  }

  reviews.forEach(
    (review) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "ai";

      div.textContent =
        review;

      container.appendChild(
        div
      );
    }
  );
}

function renderFix(
  data
) {

  const patch =
    data?.patch;

  const verification =
    data?.verification;

  if (!patch) {

    fixResultEl.classList.add(
      "hidden"
    );

    return;
  }

  fixResultEl.classList.remove(
    "hidden"
  );

  document.getElementById(
    "fixExplanation"
  ).textContent =
    patch.explanation ||
    "SmartLab generated a patch.";

  const changesEl =
    document.getElementById(
      "changes"
    );

  changesEl.innerHTML =
    "";

  const changes =
    patch.changes ||
    [];

  if (!changes.length) {

    changesEl.innerHTML =
      "<div class='status'>No automatic source change was generated.</div>";

  } else {

    changes.forEach(
      (change) => {

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "change";

        div.innerHTML =
          "<div class='change-line'>Line " +
          escapeHtml(
            change.line
          ) +
          "</div>" +

          "<div class='old-code'>− " +
          escapeHtml(
            change.oldCode
          ) +
          "</div>" +

          "<div class='new-code'>+ " +
          escapeHtml(
            change.newCode
          ) +
          "</div>" +

          "<div class='reason'>" +
          escapeHtml(
            change.reason
          ) +
          "</div>";

        changesEl.appendChild(
          div
        );
      }
    );
  }

  renderVerification(
    verification
  );
}

function renderVerification(
  verification
) {

  const container =
    document.getElementById(
      "verification"
    );

  container.innerHTML =
    "";

  if (!verification) {

    container.className =
      "verify";

    container.textContent =
      "Verification was not available.";

    return;
  }

  container.className =
    "verify " +
    (
      verification.verified
        ? "verify-pass"
        : "verify-fail"
    );

  const heading =
    verification.verified
      ? "✓ Fix verified"
      : "✕ Verification failed";

  let html =
    "<strong>" +
    heading +
    "</strong>" +
    "<div style='margin-top:5px'>" +
    escapeHtml(
      verification.reason ||
        ""
    ) +
    "</div>" +
    "<div style='margin-top:5px'>" +
    "Tests: " +
    verification.passed +
    " / " +
    verification.total +
    "</div>";

  if (
    verification.cases &&
    verification.cases.length
  ) {

    verification.cases.forEach(
      (testCase) => {

        html +=
          "<div class='test-case'>" +
          "<strong>" +
          (
            testCase.status ===
            "passed"
              ? "✓ "
              : "✕ "
          ) +
          escapeHtml(
            testCase.name
          ) +
          "</strong>" +
          "<div>Input: " +
          escapeHtml(
            testCase.input
          ) +
          "</div>" +
          "<div>Expected: " +
          escapeHtml(
            testCase.expected
          ) +
          "</div>" +
          "<div>Actual: " +
          escapeHtml(
            testCase.actual
          ) +
          "</div>" +
          "</div>";
      }
    );
  }

  container.innerHTML =
    html;

  applyFixBtn.disabled =
    !verification.verified;
}

function renderAgentAnswer(
  data
) {

  agentAnswerEl.classList.remove(
    "hidden"
  );

  const message =
    data?.message ||
    "No response from SmartLab agent.";

  let text =
    message;

  if (
    data?.analysis?.issues &&
    data.analysis.issues.length
  ) {

    text +=
      "\\n\\nDetected issues:";

    data.analysis.issues.forEach(
      (issue) => {

        text +=
          "\\n• " +
          issue.title +
          (
            issue.line
              ? " — Line " + issue.line
: ""
          ) +
          ": " +
          issue.description;
      }
    );
  }

  if (
    data?.patch?.success
  ) {

    text +=
      "\\n\\nA code patch was generated. Use Fix Current Code to inspect and apply it after verification.";
  }

  agentAnswerEl.textContent =
    text;
}

function escapeHtml(
  value
) {

  return String(
    value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

</script>

</body>
</html>`;
  }
}

function getNonce(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let value = "";

  for (let i = 0; i < 32; i += 1) {
    value += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return value;
}

export function deactivate() {}