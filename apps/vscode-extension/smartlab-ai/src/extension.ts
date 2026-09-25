import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const reviewCommand = vscode.commands.registerCommand(
    "smartlab-ai.reviewCode",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage(
          "SmartLab: No active file is open."
        );
        return;
      }

      vscode.window.showInformationMessage(
        `SmartLab: Ready to review ${editor.document.fileName}`
      );
    }
  );

  const agentProvider = new SmartLabAgentProvider();

  context.subscriptions.push(
    reviewCommand,

    vscode.window.registerWebviewViewProvider(
      "smartlab.agent",
      agentProvider
    )
  );
}

class SmartLabAgentProvider
  implements vscode.WebviewViewProvider
{
  resolveWebviewView(
    webviewView: vscode.WebviewView
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();
  }

  private getHtml(): string {
    return `
      <!DOCTYPE html>

      <html>
        <head>
          <meta
            http-equiv="Content-Security-Policy"
            content="
              default-src 'none';
              style-src 'unsafe-inline';
              script-src 'unsafe-inline';
            "
          />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 16px;
              color: var(--vscode-foreground);
              background: var(--vscode-sideBar-background);
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                sans-serif;
            }

            .header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 18px;
            }

            .logo {
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              background: white;
              color: black;
              font-weight: 700;
            }

            .title {
              font-size: 14px;
              font-weight: 600;
            }

            .subtitle {
              margin-top: 2px;
              font-size: 10px;
              color: var(--vscode-descriptionForeground);
            }

            .welcome {
              padding: 14px;
              border: 1px solid
                var(--vscode-panel-border);
              border-radius: 10px;
              background:
                var(--vscode-textCodeBlock-background);
            }

            .welcome-title {
              font-size: 13px;
              font-weight: 600;
              margin-bottom: 6px;
            }

            .welcome-text {
              font-size: 12px;
              line-height: 1.6;
              color:
                var(--vscode-descriptionForeground);
            }

            .messages {
              margin-top: 16px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .message {
              padding: 10px;
              border-radius: 8px;
              font-size: 12px;
              line-height: 1.5;
            }

            .user {
              background:
                var(--vscode-button-background);
              color:
                var(--vscode-button-foreground);
            }

            .agent {
              background:
                var(--vscode-textCodeBlock-background);
              border: 1px solid
                var(--vscode-panel-border);
            }

            .input-area {
              position: fixed;
              left: 16px;
              right: 16px;
              bottom: 16px;
            }

            textarea {
              width: 100%;
              min-height: 70px;
              resize: vertical;
              padding: 10px;
              border-radius: 8px;
              border: 1px solid
                var(--vscode-input-border);
              outline: none;
              color:
                var(--vscode-input-foreground);
              background:
                var(--vscode-input-background);
              font-family: inherit;
              font-size: 12px;
            }

            textarea:focus {
              border-color:
                var(--vscode-focusBorder);
            }

            button {
              width: 100%;
              margin-top: 8px;
              height: 32px;
              border: none;
              border-radius: 7px;
              cursor: pointer;
              color:
                var(--vscode-button-foreground);
              background:
                var(--vscode-button-background);
            }

            button:hover {
              background:
                var(--vscode-button-hoverBackground);
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="logo">✦</div>

            <div>
              <div class="title">
                SmartLab Agent
              </div>

              <div class="subtitle">
                AI coding assistant
              </div>
            </div>
          </div>

          <div class="welcome">
            <div class="welcome-title">
              How can I help?
            </div>

            <div class="welcome-text">
              Ask me about your code, errors,
              complexity, bugs or improvements.
            </div>
          </div>

          <div
            id="messages"
            class="messages"
          ></div>

          <div class="input-area">
            <textarea
              id="input"
              placeholder="Ask SmartLab..."
            ></textarea>

            <button id="send">
              Send
            </button>
          </div>

          <script>
            const input =
              document.getElementById("input");

            const send =
              document.getElementById("send");

            const messages =
              document.getElementById("messages");

            function addMessage(
              text,
              type
            ) {
              const element =
                document.createElement("div");

              element.className =
                "message " + type;

              element.textContent = text;

              messages.appendChild(element);

              messages.scrollTop =
                messages.scrollHeight;
            }

            function sendMessage() {
              const message =
                input.value.trim();

              if (!message) {
                return;
              }

              addMessage(
                message,
                "user"
              );

              input.value = "";

              setTimeout(() => {
                addMessage(
                  "SmartLab Agent is connected. AI backend will be connected in the next step.",
                  "agent"
                );
              }, 300);
            }

            send.addEventListener(
              "click",
              sendMessage
            );

            input.addEventListener(
              "keydown",
              (event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }
            );
          </script>
        </body>
      </html>
    `;
  }
}

export function deactivate() {}