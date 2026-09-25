import * as vscode from "vscode";
import * as https from "https";
import * as http from "http";

const API_URL = "http://localhost:4000";

type ReviewResponse = {
  success: boolean;
  submissionId?: string;
  message?: string;
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
    syntax: { status: "passed" | "failed"; message: string };
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
    complexity: { time: string; space: string; explanation: string };
    issues: Array<{
      type: "error" | "warning" | "info";
      title: string;
      description: string;
      line?: number;
    }>;
    metrics: { lines: number; codeLines: number; functions: number; comments: number };
    aiReview: string[];
  };
  message?: string;
};

function httpRequest(
  url: string,
  options: { method?: string; body?: string }
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.body ? { "Content-Length": Buffer.byteLength(options.body) } : {}),
      },
    };

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log("SmartLab AI activated");

  const provider = new SmartLabAgentProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("smartlab.agent", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("smartlab-ai.reviewCode", async () => {
      await reviewCurrentFile(provider);
    })
  );
}

async function reviewCurrentFile(provider: SmartLabAgentProvider) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("SmartLab: Open a code file first.");
    return;
  }

  const document = editor.document;
  const code = document.getText();
  if (!code.trim()) {
    vscode.window.showWarningMessage("SmartLab: Current file is empty.");
    return;
  }

  const language = getLanguage(document.languageId);
  const fileName = document.fileName.split("/").pop() || "unknown";

  provider.setStatus("Sending code to SmartLab...");

  try {
    const data = (await httpRequest(`${API_URL}/api/review`, {
      method: "POST",
      body: JSON.stringify({ code, language, fileName }),
    })) as ReviewResponse;

    if (!data.success || !data.submissionId) {
      throw new Error(data.message || "Review failed.");
    }

    provider.setReview({ submissionId: data.submissionId, fileName, language });
    await provider.loadReview();

    vscode.window.showInformationMessage("SmartLab: Code review completed.");
  } catch (error) {
    console.error("SmartLab review error:", error);
    provider.setStatus("Backend connection failed.");
    vscode.window.showErrorMessage(
      "SmartLab: Backend not reachable. Start the server on port 4000."
    );
  }
}

function getLanguage(languageId: string): string {
  const map: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    javascriptreact: "javascriptreact",
    typescriptreact: "typescriptreact",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
  };
  return map[languageId] || languageId || "unknown";
}

class SmartLabAgentProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private review: { submissionId: string; fileName: string; language: string } | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "review":
            await reviewCurrentFile(this);
            break;
          case "openWebReview":
            this.openWebReview();
            break;
          case "refresh":
            await this.loadReview();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  setStatus(status: string) {
    this.send({ command: "status", status });
  }

  setReview(review: { submissionId: string; fileName: string; language: string }) {
    this.review = review;
    this.send({ command: "reviewCreated", review });
  }

  async loadReview() {
    if (!this.review) return;
    this.setStatus("Loading review...");

    try {
      const data = (await httpRequest(
        `${API_URL}/api/review/${this.review.submissionId}`,
        {}
      )) as ReviewData;

      if (!data.success) {
        throw new Error(data.message || "Unable to load review.");
      }

      this.send({ command: "reviewData", data });
      this.setStatus("Review ready");
    } catch (error) {
      console.error("SmartLab load review error:", error);
      this.setStatus("Unable to load review.");
    }
  }

  private openWebReview() {
    if (!this.review) {
      vscode.window.showWarningMessage("SmartLab: Review code first.");
      return;
    }
    vscode.env.openExternal(
      vscode.Uri.parse(`http://localhost:3000/review/${this.review.submissionId}`)
    );
  }

  private send(message: unknown) {
    this.view?.webview.postMessage(message);
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>
* { box-sizing: border-box; }
body {
  margin: 0; padding: 16px;
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.logo {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
}
.title { font-size: 15px; font-weight: 600; }
.subtitle { margin-top: 2px; font-size: 11px; opacity: .6; }
.card {
  padding: 14px; margin-bottom: 12px;
  border-radius: 10px; border: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
}
.card-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.description { font-size: 12px; line-height: 1.5; opacity: .7; margin-bottom: 14px; }
button {
  width: 100%; padding: 9px 12px; border: none;
  border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
}
button:hover { background: var(--vscode-button-hoverBackground); }
button:disabled { opacity: .5; cursor: not-allowed; }
button.secondary {
  margin-top: 8px;
  color: var(--vscode-foreground);
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-panel-border);
}
.status { margin-top: 10px; font-size: 11px; opacity: .65; }
.hidden { display: none; }
.score { font-size: 28px; font-weight: 700; margin: 8px 0; }
.success { color: var(--vscode-testing-iconPassed); }
.error { color: var(--vscode-testing-iconFailed); }
.warning { color: var(--vscode-editorWarning-foreground); }
.info { color: var(--vscode-textLink-foreground); }
.row {
  display: flex; justify-content: space-between; gap: 10px;
  padding: 7px 0; border-bottom: 1px solid var(--vscode-panel-border);
  font-size: 11px;
}
.row:last-child { border-bottom: none; }
.label { opacity: .55; }
.value { text-align: right; font-weight: 600; }
.issue {
  padding: 9px; margin-top: 8px; border-radius: 7px;
  background: var(--vscode-textCodeBlock-background);
}
.issue-title { font-size: 12px; font-weight: 600; }
.issue-description { margin-top: 4px; font-size: 11px; line-height: 1.4; opacity: .7; }
.ai {
  padding: 8px 0; font-size: 11px; line-height: 1.5;
  border-bottom: 1px solid var(--vscode-panel-border);
}
.ai:last-child { border-bottom: none; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">S</div>
  <div>
    <div class="title">SmartLab AI</div>
    <div class="subtitle">Smart Code Review Agent</div>
  </div>
</div>

<div class="card">
  <div class="card-title">Code Review</div>
  <div class="description">
    Review the currently opened source file for syntax,
    complexity, edge cases and potential issues.
  </div>
  <button id="review">Review Current Code</button>
  <button id="web" class="secondary">Open Web Review</button>
  <div id="status" class="status">Ready</div>
</div>

<div id="reviewResult" class="hidden">
  <div class="card">
    <div class="card-title">Score</div>
    <div id="score" class="score">-</div>
  </div>

  <div class="card">
    <div class="card-title">Analysis</div>
    <div class="row"><span class="label">File</span><span id="file" class="value">-</span></div>
    <div class="row"><span class="label">Language</span><span id="language" class="value">-</span></div>
    <div class="row"><span class="label">Syntax</span><span id="syntax" class="value">-</span></div>
    <div class="row"><span class="label">Time</span><span id="time" class="value">-</span></div>
    <div class="row"><span class="label">Space</span><span id="space" class="value">-</span></div>
    <div class="row"><span class="label">Tests</span><span id="tests" class="value">-</span></div>
  </div>

  <div class="card">
    <div class="card-title">Issues</div>
    <div id="issues"></div>
  </div>

  <div class="card">
    <div class="card-title">AI Review</div>
    <div id="aiReview"></div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
const reviewBtn = document.getElementById("review");
const webBtn = document.getElementById("web");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("reviewResult");

reviewBtn.addEventListener("click", () => {
  reviewBtn.disabled = true;
  statusEl.textContent = "Reviewing code...";
  vscode.postMessage({ command: "review" });
});

webBtn.addEventListener("click", () => {
  vscode.postMessage({ command: "openWebReview" });
});

window.addEventListener("message", event => {
  const msg = event.data;

  if (msg.command === "status") {
    statusEl.textContent = msg.status;
    if (msg.status === "Review ready" || msg.status.includes("failed") || msg.status.includes("Unable")) {
      reviewBtn.disabled = false;
    }
  }

  if (msg.command === "reviewCreated") {
    statusEl.textContent = "Code submitted. Loading review...";
  }

  if (msg.command === "reviewData") {
    reviewBtn.disabled = false;
    const data = msg.data;
    if (!data || !data.submission) return;
    const r = data.submission;

    resultEl.classList.remove("hidden");
    document.getElementById("score").textContent = r.score ?? "-";
    document.getElementById("file").textContent = r.fileName ?? "-";
    document.getElementById("language").textContent = r.language ?? "-";

    const syntaxEl = document.getElementById("syntax");
    syntaxEl.textContent = r.syntax?.status ?? "-";
    syntaxEl.className = "value " + (r.syntax?.status === "passed" ? "success" : "error");

    document.getElementById("time").textContent = r.complexity?.time ?? "-";
    document.getElementById("space").textContent = r.complexity?.space ?? "-";
    document.getElementById("tests").textContent =
      (r.tests?.passed ?? 0) + " / " + (r.tests?.total ?? 0);

    renderIssues(r.issues || []);
    renderAIReview(r.aiReview || []);
    statusEl.textContent = "Review ready";
  }
});

function renderIssues(issues) {
  const container = document.getElementById("issues");
  container.innerHTML = "";
  if (!issues.length) {
    container.innerHTML = "<div class='status'>No issues detected.</div>";
    return;
  }
  issues.forEach(issue => {
    const div = document.createElement("div");
    div.className = "issue";
    div.innerHTML =
      "<div class='issue-title " + issue.type + "'>" + escapeHtml(issue.title) + (issue.line ? " — Line " + issue.line : "") + "</div>" +
      "<div class='issue-description'>" + escapeHtml(issue.description) + "</div>";
    container.appendChild(div);
  });
}

function renderAIReview(reviews) {
  const container = document.getElementById("aiReview");
  container.innerHTML = "";
  if (!reviews.length) {
    container.innerHTML = "<div class='status'>No AI review available.</div>";
    return;
  }
  reviews.forEach(r => {
    const div = document.createElement("div");
    div.className = "ai";
    div.textContent = r;
    container.appendChild(div);
  });
}

function escapeHtml(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
</script>

</body>
</html>`;
  }
}

export function deactivate() {}