import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const workspaceRoot = process.cwd();
const outputDir = path.join(workspaceRoot, "dist-electron");
const debugPort = Number(process.env.GOOEY_PI_SMOKE_DEBUG_PORT ?? 9323);
const timeoutMs = 45_000;

const appBundle = await findFirstAppBundle(outputDir);
if (!appBundle) {
  throw new Error("No packaged .app found. Run `corepack pnpm dist:mac` before the smoke test.");
}

const appBinary = path.join(appBundle, "Contents/MacOS/Gooey Pi");
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "gooey-pi-smoke-"));
const userDataDir = path.join(tempRoot, "user-data");
const projectDir = path.join(tempRoot, "project");

let appProcess;

try {
  await mkdir(userDataDir, { recursive: true });
  await mkdir(projectDir, { recursive: true });
  await writeFile(path.join(projectDir, "README.md"), "# Gooey Pi smoke project\n", "utf8");
  await seedProjectRegistry(userDataDir, projectDir);

  appProcess = spawn(appBinary, [`--remote-debugging-port=${debugPort}`], {
    env: {
      ...process.env,
      GOOEY_PI_USER_DATA_DIR: userDataDir,
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const stderr = [];
  appProcess.stderr?.on("data", (chunk) => stderr.push(chunk.toString()));
  appProcess.stdout?.on("data", (chunk) => stderr.push(chunk.toString()));

  const page = await waitForDebugPage(debugPort);
  const smokeResult = await evaluateInPage(page.webSocketDebuggerUrl, createSmokeExpression(projectDir));

  if (!smokeResult?.ok) {
    throw new Error(
      [
        "Packaged chat smoke test failed.",
        smokeResult?.reason ? `Reason: ${smokeResult.reason}` : null,
        smokeResult?.details ? `Details: ${JSON.stringify(smokeResult.details, null, 2)}` : null,
        stderr.length > 0 ? `App output:\n${stderr.join("")}` : null
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  console.log("Packaged chat smoke test passed.");
  console.log(`App bundle: ${path.relative(workspaceRoot, appBundle)}`);
  console.log(`Project: ${projectDir}`);
  console.log(`Session: ${smokeResult.sessionId}`);
  console.log(`Chat: ${smokeResult.chatId}`);
} finally {
  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGTERM");
  }

  await rm(tempRoot, { force: true, recursive: true }).catch(() => null);
}

async function findFirstAppBundle(dir, depth = 0) {
  if (depth > 4) {
    return null;
  }

  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name.endsWith(".app")) {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const nested = await findFirstAppBundle(entryPath, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

async function seedProjectRegistry(userDataDir, projectDir) {
  const now = new Date().toISOString();
  await writeFile(
    path.join(userDataDir, "project-registry.json"),
    JSON.stringify(
      {
        projects: [
          {
            addedAt: now,
            id: "project-smoke",
            lastSelectedAt: now,
            name: "Smoke Project",
            path: projectDir,
            updatedAt: now
          }
        ],
        selectedProjectId: "project-smoke",
        version: 1
      },
      null,
      2
    ),
    "utf8"
  );
}

async function waitForDebugPage(port) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);

      if (page) {
        return page;
      }
    } catch {
      // Wait for the packaged app to finish booting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for packaged app debug page on port ${port}.`);
}

function createSmokeExpression(projectDir) {
  return `(async () => {
    const api = window.gooeyPi;
    if (!api) {
      return { ok: false, reason: "preload-api-missing" };
    }

    await api.clearEventStream("all");
    const project = await api.getProjectFolderState();

    if (project.state.path !== ${JSON.stringify(projectDir)} || !project.state.valid) {
      return {
        ok: false,
        reason: "project-not-restored",
        details: { project: project.state }
      };
    }

    let textarea = null;
    const composerStartedAt = Date.now();

    while (Date.now() - composerStartedAt < 10000) {
      textarea = document.querySelector("textarea");

      if (textarea) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (!textarea) {
      return {
        ok: false,
        reason: "composer-textarea-missing",
        details: { body: document.body.innerText.slice(0, 1600) }
      };
    }

    const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    valueSetter.call(textarea, "Packaged app smoke test: start a new chat.");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 150));

    const submitButton = [...document.querySelectorAll("button")].find((button) =>
      ["Create project", "Send message", "Submit"].includes(button.getAttribute("aria-label") ?? "")
    );

    if (!submitButton || submitButton.disabled) {
      return {
        ok: false,
        reason: "submit-button-unavailable",
        details: {
          buttons: [...document.querySelectorAll("button")].map((button) => ({
            ariaLabel: button.getAttribute("aria-label"),
            disabled: button.disabled,
            text: button.innerText
          }))
        }
      };
    }

    const sessionResult = await api.createAgentSession(${JSON.stringify(projectDir)});

    if (sessionResult.error || !sessionResult.session?.id) {
      return {
        ok: false,
        reason: "agent-session-create-failed",
        details: sessionResult
      };
    }

    const chatResult = await api.createChatRegistryChat({
      projectPath: ${JSON.stringify(projectDir)},
      sessionId: sessionResult.session.id,
      sessionFile: "smoke-session.json",
      title: "Packaged smoke chat"
    });

    if (chatResult.error || !chatResult.chat?.id) {
      return {
        ok: false,
        reason: "chat-create-failed",
        details: chatResult
      };
    }

    const [events, session, chats] = await Promise.all([
      api.getEventStreamSnapshot(),
      api.getAgentSession(),
      api.getChatRegistry()
    ]);
    const agentSessionError = events.errors.find((error) => error.code === "AGENT_SESSION_CREATE_FAILED");

    if (agentSessionError) {
      return {
        ok: false,
        reason: "agent-session-create-failed-event",
        details: { error: agentSessionError, session }
      };
    }

    const projectChats = chats.projects.find((entry) => entry.path === ${JSON.stringify(projectDir)});
    const activeChat = projectChats?.chats?.find((chat) => chat.id === chatResult.chat.id) ?? null;

    if (session.id && session.projectPath === ${JSON.stringify(projectDir)} && activeChat) {
      return {
        ok: true,
        chatId: activeChat.id,
        sessionId: session.id,
        sessionStatus: session.status
      };
    }

    return {
      ok: false,
      reason: "chat-session-not-active",
      details: { errors: events.errors, session, chats, body: document.body.innerText.slice(0, 1600) }
    };
  })()`;
}

async function evaluateInPage(webSocketDebuggerUrl, expression) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  try {
    const response = await send(socket, {
      id: ++nextId,
      method: "Runtime.evaluate",
      params: {
        awaitPromise: true,
        expression,
        returnByValue: true,
        timeout: timeoutMs
      }
    });

    if (response.exceptionDetails) {
      throw new Error(JSON.stringify(response.exceptionDetails, null, 2));
    }

    return response.result?.value;
  } finally {
    socket.close();
  }
}

function send(socket, message) {
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const response = JSON.parse(event.data);

      if (response.id !== message.id) {
        return;
      }

      socket.removeEventListener("message", onMessage);
      response.error ? reject(response.error) : resolve(response.result);
    };

    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify(message));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
