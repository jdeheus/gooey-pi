import { createAppError, type AppError } from "@shared/errors";
import type { PiRuntimeSnapshot } from "@shared/pi";

type PiSdkModule = typeof import("@earendil-works/pi-coding-agent");

const packageName = "@earendil-works/pi-coding-agent";
const packageVersion = "0.74.0";
const startupTimeoutMs = 8_000;

let sdkModule: PiSdkModule | null = null;
let inFlightStartup: Promise<PiRuntimeSnapshot> | null = null;

let runtimeSnapshot: PiRuntimeSnapshot = {
  status: "unchecked",
  packageName,
  packageVersion,
  checkedAt: null,
  errorId: null,
  error: null
};

function timeoutError(): AppError {
  return createAppError({
    code: "PI_RUNTIME_START_FAILED",
    message: "Pi runtime startup timed out.",
    details: { packageName, startupTimeoutMs },
    recoverable: true
  });
}

function setRuntimeReady(): PiRuntimeSnapshot {
  runtimeSnapshot = {
    status: "ready",
    packageName,
    packageVersion,
    checkedAt: new Date().toISOString(),
    errorId: null,
    error: null
  };
  return runtimeSnapshot;
}

function setRuntimeError(error: AppError): PiRuntimeSnapshot {
  runtimeSnapshot = {
    status: "errored",
    packageName,
    packageVersion,
    checkedAt: new Date().toISOString(),
    errorId: error.id,
    error
  };
  return runtimeSnapshot;
}

async function withStartupTimeout(startup: Promise<PiSdkModule>): Promise<PiSdkModule> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      startup,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(timeoutError()), startupTimeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function loadPiSdk(): Promise<PiSdkModule> {
  if (sdkModule) {
    return sdkModule;
  }

  sdkModule = await withStartupTimeout(import("@earendil-works/pi-coding-agent"));
  return sdkModule;
}

export function getPiRuntimeState(): PiRuntimeSnapshot {
  return runtimeSnapshot;
}

export async function ensurePiRuntimeReady(): Promise<PiRuntimeSnapshot> {
  if (runtimeSnapshot.status === "ready") {
    return runtimeSnapshot;
  }

  if (inFlightStartup) {
    return inFlightStartup;
  }

  runtimeSnapshot = {
    ...runtimeSnapshot,
    status: "starting",
    checkedAt: new Date().toISOString(),
    errorId: null,
    error: null
  };

  inFlightStartup = loadPiSdk()
    .then(() => setRuntimeReady())
    .catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error) {
        return setRuntimeError(error as AppError);
      }

      return setRuntimeError(
        createAppError({
          code: "PI_RUNTIME_UNAVAILABLE",
          message: "Pi SDK could not be loaded.",
          details: error instanceof Error ? error.message : String(error),
          recoverable: true
        })
      );
    })
    .finally(() => {
      inFlightStartup = null;
    });

  return inFlightStartup;
}

export async function getPiSdk(): Promise<PiSdkModule> {
  const runtime = await ensurePiRuntimeReady();

  if (runtime.status !== "ready" || !sdkModule) {
    throw (
      runtime.error ??
      createAppError({
        code: "PI_RUNTIME_UNAVAILABLE",
        message: "Pi runtime is not ready.",
        recoverable: true
      })
    );
  }

  return sdkModule;
}
