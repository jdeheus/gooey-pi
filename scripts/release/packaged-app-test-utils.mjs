import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const workspaceRoot = process.cwd();
export const outputDir = path.join(workspaceRoot, "dist-electron");
export const finderLikePath = "/usr/bin:/bin:/usr/sbin:/sbin";

export async function createPackagedTestContext(prefix) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), prefix));
  return {
    tempRoot,
    userDataDir: path.join(tempRoot, "user-data")
  };
}

export async function findFirstAppBundle(dir = outputDir, depth = 0) {
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

export async function requirePackagedApp() {
  const appBundle = await findFirstAppBundle();

  if (!appBundle) {
    throw new Error("No packaged .app found. Run `corepack pnpm dist:mac` before standalone tests.");
  }

  return {
    appBinary: path.join(appBundle, "Contents/MacOS/Gooey Pi"),
    appBundle
  };
}

export async function seedProjectRegistry(userDataDir, projects, selectedProjectId = projects[0]?.id ?? null) {
  const now = new Date().toISOString();
  await mkdir(userDataDir, { recursive: true });
  await writeFile(
    path.join(userDataDir, "project-registry.json"),
    JSON.stringify(
      {
        projects: projects.map((project) => ({
          addedAt: project.addedAt ?? now,
          id: project.id,
          lastSelectedAt: project.lastSelectedAt ?? now,
          name: project.name,
          path: project.path,
          updatedAt: project.updatedAt ?? now
        })),
        selectedProjectId,
        version: 1
      },
      null,
      2
    ),
    "utf8"
  );
}

export function launchPackagedApp({
  appBinary,
  debugPort,
  env = {},
  userDataDir
}) {
  const appProcess = spawn(appBinary, [`--remote-debugging-port=${debugPort}`], {
    env: {
      ...process.env,
      ...env,
      GOOEY_PI_USER_DATA_DIR: userDataDir,
      PATH: env.PATH ?? finderLikePath
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output = [];

  appProcess.stdout?.on("data", (chunk) => output.push(chunk.toString()));
  appProcess.stderr?.on("data", (chunk) => output.push(chunk.toString()));

  return { appProcess, output };
}

export function stopPackagedApp(appProcess) {
  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGTERM");
  }
}

export async function waitForDebugPage(port, timeoutMs = 45_000) {
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

export async function evaluateInPage(webSocketDebuggerUrl, expression, timeoutMs = 45_000) {
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

export async function collectFailureSnapshot(page, timeoutMs = 15_000) {
  if (!page?.webSocketDebuggerUrl) {
    return null;
  }

  return evaluateInPage(
    page.webSocketDebuggerUrl,
    `(async () => {
      const api = window.gooeyPi;
      const snapshot = {
        bodyText: document.body.innerText.slice(0, 5000),
        chatRegistry: null,
        eventStream: null,
        projectState: null,
        runtimeState: null,
        session: null
      };

      if (!api) {
        return snapshot;
      }

      const safe = async (fn) => {
        try {
          return await fn();
        } catch (error) {
          return { error: error instanceof Error ? error.message : String(error) };
        }
      };

      snapshot.chatRegistry = await safe(() => api.getChatRegistry());
      snapshot.eventStream = await safe(() => api.getEventStreamSnapshot());
      snapshot.projectState = await safe(() => api.getProjectFolderState());
      snapshot.runtimeState = await safe(() => api.getPiRuntimeState());
      snapshot.session = await safe(() => api.getAgentSession());
      return snapshot;
    })()`,
    timeoutMs
  ).catch((error) => ({ snapshotError: error instanceof Error ? error.message : String(error) }));
}

export async function writeFailureReport({
  appOutput,
  details,
  page,
  tempRoot,
  title
}) {
  const snapshot = await collectFailureSnapshot(page);
  const report = {
    appOutput: appOutput.join(""),
    details,
    generatedAt: new Date().toISOString(),
    snapshot,
    title
  };
  const reportPath = path.join(tempRoot, "standalone-test-failure.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

export async function cleanupTempRoot(tempRoot, keep) {
  if (!keep) {
    await rm(tempRoot, { force: true, recursive: true }).catch(() => null);
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

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
