import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  cleanupTempRoot,
  createPackagedTestContext,
  evaluateInPage,
  finderLikePath,
  launchPackagedApp,
  requirePackagedApp,
  seedProjectRegistry,
  stopPackagedApp,
  waitForDebugPage,
  workspaceRoot,
  writeFailureReport
} from "./packaged-app-test-utils.mjs";

const liveEnabled = process.env.GOOEY_PI_LIVE_PROVIDER_TEST === "1";

if (!liveEnabled) {
  console.log("Skipping live provider test. Set GOOEY_PI_LIVE_PROVIDER_TEST=1 to run it.");
  process.exit(0);
}

const liveModel = "openai-codex/gpt-5.5:medium";
const debugPort = Number(process.env.GOOEY_PI_LIVE_DEBUG_PORT ?? 9523);
const pageTimeoutMs = 150_000;

class LiveFailure extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

const { appBinary, appBundle } = await requirePackagedApp();
const context = await createPackagedTestContext("gooey-pi-live-");
const projectDir = path.join(context.tempRoot, "live-project");
let appProcess;
let appOutput = [];
let page = null;
let keepTempRoot = false;

try {
  await mkdir(projectDir, { recursive: true });
  await writeFile(path.join(projectDir, "README.md"), "# Gooey Pi live provider test\n", "utf8");
  await seedProjectRegistry(
    context.userDataDir,
    [{ id: "live-project", name: "Live Provider Project", path: projectDir }],
    "live-project"
  );

  ({ appProcess, output: appOutput } = launchPackagedApp({
    appBinary,
    debugPort,
    env: {
      PATH: finderLikePath
    },
    userDataDir: context.userDataDir
  }));
  page = await waitForDebugPage(debugPort, pageTimeoutMs);

  const result = await evaluateInPage(
    page.webSocketDebuggerUrl,
    createLiveExpression({ liveModel, projectDir, timeoutMs: pageTimeoutMs }),
    pageTimeoutMs
  );

  if (!result?.ok) {
    throw new LiveFailure("Live GPT-5.5 packaged test failed.", result);
  }

  console.log("Live GPT-5.5 packaged test passed.");
  console.log(`App bundle: ${path.relative(workspaceRoot, appBundle)}`);
  console.log(`Project: ${projectDir}`);
  console.log(`Run: ${result.runId}`);
  console.log(`Assistant events: ${result.assistantEventCount}`);
} catch (error) {
  keepTempRoot = true;
  const reportPath = await writeFailureReport({
    appOutput,
    details: error instanceof LiveFailure ? error.details : { error: String(error) },
    page,
    tempRoot: context.tempRoot,
    title: error instanceof Error ? error.message : "Live packaged test failed."
  });
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`${message}\nFailure report: ${reportPath}\nTemp root preserved: ${context.tempRoot}`);
} finally {
  stopPackagedApp(appProcess);
  await cleanupTempRoot(context.tempRoot, keepTempRoot);
}

function createLiveExpression({ liveModel, projectDir, timeoutMs }) {
  return `(async () => {
    const api = window.gooeyPi;
    const fail = (reason, details = {}) => ({ ok: false, reason, details });
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const expectedModel = ${JSON.stringify(liveModel)};
    const expectedPrompt = "Reply with exactly: Gooey Pi GPT-5.5 live test passed.";

    if (!api) {
      return fail("preload-api-missing");
    }

    await api.clearEventStream("all");
    const settings = await api.updateRuntimeSettings({
      models: {
        agentModel: expectedModel,
        fallbackModel: "openai-codex/gpt-5.5:low",
        primaryModel: expectedModel
      }
    });

    if (settings.models.primaryModel !== expectedModel) {
      return fail("primary-model-not-set-to-gpt-5-5", { settings });
    }

    const project = await api.getProjectFolderState();
    if (project.state?.path !== ${JSON.stringify(projectDir)} || !project.state.valid) {
      return fail("project-not-restored", { project });
    }

    const sessionResult = await api.createAgentSession(${JSON.stringify(projectDir)});
    if (sessionResult.error || !sessionResult.session?.id) {
      return fail("agent-session-create-failed", sessionResult);
    }

    const chat = await api.createChatRegistryChat({
      projectPath: ${JSON.stringify(projectDir)},
      sessionFile: "live-provider-session.json",
      sessionId: sessionResult.session.id,
      title: "Live GPT-5.5 chat"
    });
    if (!chat.chat?.id) {
      return fail("chat-create-failed", chat);
    }
    await api.selectChatRegistryChat({ projectPath: ${JSON.stringify(projectDir)}, chatId: chat.chat.id });

    const submit = await api.submitPrompt({
      attachments: [],
      intent: "send",
      model: {
        modelId: expectedModel,
        role: "primary",
        thinkingLevel: "medium"
      },
      planMode: false,
      selectedTokens: [],
      text: expectedPrompt
    });

    if (submit.error || submit.status !== "accepted" || !submit.runId) {
      return fail("prompt-submit-failed", submit);
    }

    const startedAt = Date.now();
    let lastSnapshot = null;

    while (Date.now() - startedAt < ${Number(timeoutMs)}) {
      const [events, session] = await Promise.all([
        api.getEventStreamSnapshot(),
        api.getAgentSession()
      ]);
      lastSnapshot = { events, session };

      const requestModelEvents = events.rawEvents.filter((event) =>
        JSON.stringify(event).includes(expectedModel)
      );
      const userModelRecorded = requestModelEvents.length > 0;
      const assistantEvents = events.rawEvents.filter((event) =>
        JSON.stringify(event).toLowerCase().includes("assistant")
      );
      const completed = session.status !== "running" && session.status !== "starting" && assistantEvents.length > 0;
      const modelFields = events.rawEvents
        .flatMap((event) => [
          event.payload?.model,
          event.payload?.message?.model,
          event.payload?.assistant?.model,
          event.payload?.response?.model
        ])
        .filter(Boolean)
        .map(String);

      const unexpectedModel = modelFields.find((model) => !model.toLowerCase().includes("gpt-5.5"));
      if (unexpectedModel) {
        return fail("sdk-remapped-live-model", {
          expectedModel,
          modelFields,
          unexpectedModel
        });
      }

      if (events.errors.some((error) => error.code === "AGENT_SESSION_CREATE_FAILED")) {
        return fail("agent-session-create-failed-event", { events, session });
      }

      if (userModelRecorded && completed) {
        return {
          ok: true,
          assistantEventCount: assistantEvents.length,
          runId: submit.runId,
          status: session.status
        };
      }

      await sleep(1000);
    }

    return fail("timed-out-waiting-for-assistant-output", {
      expectedModel,
      lastSnapshot
    });
  })()`;
}
