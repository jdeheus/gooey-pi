import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
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

const execFileAsync = promisify(execFile);
const debugPort = Number(process.env.GOOEY_PI_BATTERY_DEBUG_PORT ?? 9423);
const pageTimeoutMs = 60_000;

class BatteryFailure extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

const { appBinary, appBundle } = await requirePackagedApp();
const context = await createPackagedTestContext("gooey-pi-battery-");
const projectDir = path.join(context.tempRoot, "project-one");
const secondProjectDir = path.join(context.tempRoot, "project-two");
const outsideSentinel = path.join(context.tempRoot, "outside-sentinel.txt");
let appProcess;
let appOutput = [];
let page = null;
let keepTempRoot = false;

try {
  await prepareGitProject(projectDir);
  await mkdir(secondProjectDir, { recursive: true });
  await writeFile(path.join(secondProjectDir, "README.md"), "# Second project\n", "utf8");
  await writeFile(outsideSentinel, "outside untouched\n", "utf8");
  await seedProjectRegistry(
    context.userDataDir,
    [
      { id: "project-one", name: "Battery Project", path: projectDir },
      { id: "project-two", name: "Second Battery Project", path: secondProjectDir }
    ],
    "project-one"
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

  const firstRun = await evaluateInPage(
    page.webSocketDebuggerUrl,
    createBatteryExpression({ projectDir, secondProjectDir }),
    pageTimeoutMs
  );

  if (!firstRun?.ok) {
    throw new BatteryFailure("Packaged battery failed during first run.", firstRun);
  }

  stopPackagedApp(appProcess);
  await waitForExit(appProcess);
  ({ appProcess, output: appOutput } = launchPackagedApp({
    appBinary,
    debugPort: debugPort + 1,
    env: {
      PATH: finderLikePath
    },
    userDataDir: context.userDataDir
  }));
  page = await waitForDebugPage(debugPort + 1, pageTimeoutMs);

  const restartRun = await evaluateInPage(
    page.webSocketDebuggerUrl,
    createRestartExpression({ projectDir }),
    pageTimeoutMs
  );

  if (!restartRun?.ok) {
    throw new BatteryFailure("Packaged battery failed after restart.", restartRun);
  }

  const sentinel = await readFile(outsideSentinel, "utf8");
  if (sentinel !== "outside untouched\n") {
    throw new BatteryFailure("Checkpoint restore touched a file outside the temp repo.", { sentinel });
  }

  console.log("Packaged app test battery passed.");
  console.log(`App bundle: ${path.relative(workspaceRoot, appBundle)}`);
  console.log(`Project: ${projectDir}`);
  console.log(`Checks: ${[...firstRun.passes, ...restartRun.passes].join(", ")}`);
} catch (error) {
  keepTempRoot = true;
  const reportPath = await writeFailureReport({
    appOutput,
    details: error instanceof BatteryFailure ? error.details : { error: String(error) },
    page,
    tempRoot: context.tempRoot,
    title: error instanceof Error ? error.message : "Packaged battery failed."
  });
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`${message}\nFailure report: ${reportPath}\nTemp root preserved: ${context.tempRoot}`);
} finally {
  stopPackagedApp(appProcess);
  await cleanupTempRoot(context.tempRoot, keepTempRoot);
}

async function prepareGitProject(projectPath) {
  await mkdir(projectPath, { recursive: true });
  await mkdir(path.join(projectPath, "src"), { recursive: true });
  await writeFile(path.join(projectPath, "README.md"), "# Battery project\n", "utf8");
  await writeFile(path.join(projectPath, "src", "app.ts"), "export const value = 1;\n", "utf8");
  await git(projectPath, ["init"]);
  await git(projectPath, ["config", "user.email", "gooey-pi-tests@example.invalid"]);
  await git(projectPath, ["config", "user.name", "Gooey Pi Tests"]);
  await git(projectPath, ["add", "README.md", "src/app.ts"]);
  await git(projectPath, ["commit", "-m", "Initial battery project"]);
  await writeFile(
    path.join(projectPath, "README.md"),
    "# Battery project\n\nGenerated packaged-app change.\n",
    "utf8"
  );
  await writeFile(path.join(projectPath, "src", "new-file.ts"), "export const generated = true;\n", "utf8");
}

async function git(cwd, args) {
  await execFileAsync("git", args, { cwd, maxBuffer: 1024 * 1024 });
}

function createBatteryExpression({ projectDir, secondProjectDir }) {
  return `(async () => {
    const passes = [];
    const api = window.gooeyPi;
    const fail = (reason, details = {}) => ({ ok: false, passes, reason, details });
    const pass = (label) => passes.push(label);
    const assert = (condition, reason, details = {}) => {
      if (!condition) {
        throw Object.assign(new Error(reason), { details });
      }
    };
    const safe = async (fn) => {
      try {
        return await fn();
      } catch (error) {
        return { thrown: error instanceof Error ? error.message : String(error) };
      }
    };

    try {
      assert(api, "preload-api-missing");

      const ping = await api.ping();
      assert(ping?.ok === true, "ping-failed", { ping });
      pass("ping");

      await api.clearEventStream("all");
      const [project, runtime, catalog, settings, registry] = await Promise.all([
        api.getProjectFolderState(),
        api.getPiRuntimeState(),
        api.getPiModelCatalog(),
        api.getRuntimeSettings(),
        api.getChatRegistry()
      ]);

      assert(project.state?.path === ${JSON.stringify(projectDir)}, "seeded-project-not-restored", { project });
      assert(project.state?.valid === true, "seeded-project-invalid", { project });
      assert(runtime.status !== "errored", "runtime-started-errored", { runtime });
      assert(catalog && Array.isArray(catalog.providers), "model-catalog-unavailable", { catalog });
      assert(settings?.models?.primaryModel, "settings-unavailable", { settings });
      assert(Array.isArray(registry.projects), "chat-registry-unavailable", { registry });
      pass("boot-bridge-runtime-catalog");

      const patchedSettings = await api.updateRuntimeSettings({
        agentBehavior: {
          parallelism: 4,
          reviewPreference: "diffs-on-request",
          subagentPolicy: "ask-first"
        },
        approvals: {
          mode: "manual-review",
          permissionPolicy: { destructive: "allow", github: "ask" },
          requireDestructiveApproval: false,
          showTierTwoDetails: true
        },
        githubAutomation: {
          autoBranch: true,
          autoCommit: true,
          autoPull: false,
          autoPush: false,
          openPullRequest: true
        },
        models: {
          agentModel: "openai-codex/gpt-5.5:medium",
          fallbackModel: "openai-codex/gpt-5.5:low",
          primaryModel: "openai-codex/gpt-5.5:medium"
        },
        operatorProfile: "engineer"
      });
      assert(
        patchedSettings.approvals.permissionPolicy.destructive === "ask",
        "destructive-policy-normalized-unsafely",
        { patchedSettings }
      );
      pass("settings-normalization");

      const createdSession = await api.createAgentSession(${JSON.stringify(projectDir)});
      assert(!createdSession.error, "agent-session-create-failed", createdSession);
      assert(createdSession.session?.id, "agent-session-missing-id", createdSession);
      pass("agent-session-create");

      const chatOne = await api.createChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        sessionId: createdSession.session.id,
        sessionFile: "battery-session-one.json",
        title: "Battery chat one"
      });
      assert(chatOne.chat?.id, "chat-create-failed", chatOne);
      const rename = await api.renameChatRegistryChat({ chatId: chatOne.chat.id, title: "Renamed battery chat" });
      assert(rename.chat?.title === "Renamed battery chat", "chat-rename-failed", rename);
      const chatTwo = await api.createChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        sessionId: createdSession.session.id,
        sessionFile: "battery-session-two.json",
        title: "Battery chat two"
      });
      assert(chatTwo.chat?.id && chatTwo.chat.id !== chatOne.chat.id, "second-chat-create-failed", chatTwo);
      const selectOne = await api.selectChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        chatId: chatOne.chat.id
      });
      assert(selectOne.snapshot.projects.some((entry) =>
        entry.path === ${JSON.stringify(projectDir)} && entry.activeChatId === chatOne.chat.id
      ), "chat-select-failed", selectOne);
      pass("chat-registry-lifecycle");

      const secondProjectChat = await api.createChatRegistryChat({
        projectPath: ${JSON.stringify(secondProjectDir)},
        sessionId: null,
        sessionFile: null,
        title: "Project-header new chat target"
      });
      assert(secondProjectChat.chat?.projectPath === ${JSON.stringify(secondProjectDir)}, "project-target-chat-failed", secondProjectChat);
      pass("project-targeted-new-chat");

      const deleted = await api.deleteChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        chatId: chatTwo.chat.id,
        mode: "delete"
      });
      assert(!deleted.error, "chat-delete-failed", deleted);
      const deletedRestore = await api.selectChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        chatId: chatTwo.chat.id
      });
      assert(deletedRestore.error, "missing-chat-select-should-fail", deletedRestore);
      const restore = await api.restoreActiveChat(${JSON.stringify(projectDir)});
      assert(
        restore.chat === null && restore.fallbackReason === "no-selected-chat",
        "new-chat-fallback-after-deleted-active-chat-failed",
        restore
      );
      const reselectOne = await api.selectChatRegistryChat({
        projectPath: ${JSON.stringify(projectDir)},
        chatId: chatOne.chat.id
      });
      assert(!reselectOne.error, "chat-reselect-after-recovery-failed", reselectOne);
      pass("missing-chat-recovery");

      const gitStatus = await api.getGitStatus();
      assert(Array.isArray(gitStatus.files) && gitStatus.files.length >= 1, "git-status-empty", gitStatus);
      const changeSummary = await api.getChangeSummary();
      assert(changeSummary.files.length >= 1, "change-summary-empty", changeSummary);
      const diffPath = changeSummary.files[0].path;
      const diff = await api.getChangeReviewDiff([diffPath]);
      assert(diff.files.length === 1 && diff.files[0].path === diffPath, "change-diff-failed", diff);
      const openDiff = await api.openChangeDiff(diffPath);
      assert(
        openDiff.ok === true || (openDiff.ok === false && openDiff.error?.code),
        "open-change-diff-not-structured",
        openDiff
      );
      pass("git-change-review");

      const checkpoint = await api.createChangeCheckpoint({ runId: "battery-run", type: "manual" });
      assert(checkpoint.ok && checkpoint.checkpoint?.id, "checkpoint-create-failed", checkpoint);
      const restoreCheckpoint = await api.restoreChangeCheckpoint({ checkpointId: checkpoint.checkpoint.id });
      assert(restoreCheckpoint.status === "restored", "checkpoint-restore-failed", restoreCheckpoint);
      pass("checkpoint-restore-temp-repo");

      const invalidApproval = await api.respondToToolApproval({
        decision: "approved",
        rememberChoice: false,
        requestId: "missing-battery-approval"
      });
      assert(invalidApproval.ok === false && invalidApproval.errorMessage, "invalid-approval-should-error", invalidApproval);
      const approvalAudit = await api.getToolApprovalAuditTrail();
      assert(Array.isArray(approvalAudit), "approval-audit-unavailable", approvalAudit);
      pass("approval-guards");

      const events = await api.getEventStreamSnapshot();
      const startupErrors = events.errors.filter((error) =>
        ["PI_RUNTIME_UNAVAILABLE", "AGENT_SESSION_CREATE_FAILED"].includes(error.code)
      );
      assert(startupErrors.length === 0, "startup-or-session-errors-recorded", { startupErrors, events });
      await api.clearEventStream("all");
      const clearedEvents = await api.getEventStreamSnapshot();
      assert(clearedEvents.errors.length === 0, "diagnostics-clear-failed", clearedEvents);
      pass("diagnostics-clear");

      const textarea = document.querySelector("textarea");
      assert(textarea, "composer-textarea-missing", { body: document.body.innerText.slice(0, 1600) });
      pass("renderer-composer-present");

      return {
        ok: true,
        chatId: chatOne.chat.id,
        passes,
        sessionId: createdSession.session.id
      };
    } catch (error) {
      return fail(error.message ?? "battery-exception", error.details ?? {
        body: document.body.innerText.slice(0, 3000)
      });
    }
  })()`;
}

function createRestartExpression({ projectDir }) {
  return `(async () => {
    const passes = [];
    const fail = (reason, details = {}) => ({ ok: false, passes, reason, details });
    const pass = (label) => passes.push(label);
    const api = window.gooeyPi;

    try {
      if (!api) {
        return fail("preload-api-missing-after-restart");
      }

      const [settings, registry, project] = await Promise.all([
        api.getRuntimeSettings(),
        api.getChatRegistry(),
        api.getProjectFolderState()
      ]);

      if (settings.operatorProfile !== "engineer") {
        return fail("settings-profile-not-persisted", { settings });
      }

      if (settings.models.primaryModel !== "openai-codex/gpt-5.5:medium") {
        return fail("settings-model-not-persisted", { settings });
      }

      if (settings.approvals.permissionPolicy.destructive !== "ask") {
        return fail("destructive-policy-not-safe-after-restart", { settings });
      }

      if (project.state?.path !== ${JSON.stringify(projectDir)}) {
        return fail("project-not-restored-after-restart", { project });
      }

      const projectRegistry = registry.projects.find((entry) => entry.path === ${JSON.stringify(projectDir)});
      const renamed = projectRegistry?.chats?.find((chat) => chat.title === "Renamed battery chat");

      if (!renamed) {
        return fail("renamed-chat-not-persisted", { registry });
      }

      pass("settings-persisted");
      pass("project-restore-after-restart");
      pass("chat-rename-persisted");
      return { ok: true, passes };
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error));
    }
  })()`;
}

function waitForExit(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    childProcess.once("exit", resolve);
    setTimeout(resolve, 3000);
  });
}
