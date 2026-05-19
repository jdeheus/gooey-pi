import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const outputDir = path.join(workspaceRoot, "dist-electron");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findAppBundles(dir, depth = 0) {
  if (depth > 4 || !(await exists(dir))) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const apps = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.endsWith(".app")) {
      apps.push(entryPath);
      continue;
    }
    if (entry.isDirectory()) {
      apps.push(...(await findAppBundles(entryPath, depth + 1)));
    }
  }

  return apps;
}

async function findZipArtifacts(dir, depth = 0) {
  if (depth > 2 || !(await exists(dir))) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const zips = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.endsWith(".zip")) {
      zips.push(entryPath);
      continue;
    }
    if (entry.isDirectory()) {
      zips.push(...(await findZipArtifacts(entryPath, depth + 1)));
    }
  }

  return zips;
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath);
}

const appBundles = await findAppBundles(outputDir);
if (appBundles.length === 0) {
  throw new Error("No macOS .app bundle found under dist-electron. Run `corepack pnpm run pack` first.");
}

for (const appBundle of appBundles) {
  const requiredPaths = [
    "Contents/Info.plist",
    "Contents/MacOS/Gooey Pi",
    "Contents/Resources/app.asar",
  ];

  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(appBundle, requiredPath);
    if (!(await exists(fullPath))) {
      throw new Error(`Missing packaged artifact: ${relative(fullPath)}`);
    }
  }

  const unpackedDir = path.join(appBundle, "Contents/Resources/app.asar.unpacked");
  if (await exists(unpackedDir)) {
    const unpackedStats = await stat(unpackedDir);
    if (!unpackedStats.isDirectory()) {
      throw new Error(`Packaged unpack path is not a directory: ${relative(unpackedDir)}`);
    }
  }

  const appAsar = path.join(appBundle, "Contents/Resources/app.asar");
  const appAsarBuffer = await readFile(appAsar);
  const appAsarIndex = appAsarBuffer.subarray(0, Math.min(appAsarBuffer.length, 8 * 1024 * 1024)).toString("utf8");
  const requiredRuntimePackages = ["partial-json"];

  for (const requiredPackage of requiredRuntimePackages) {
    if (!appAsarIndex.includes(`"${requiredPackage}":{"files"`)) {
      throw new Error(`Missing packaged runtime dependency: ${requiredPackage}`);
    }
  }
}

const zipArtifacts = await findZipArtifacts(outputDir);

console.log("Standalone artifact verification passed.");
console.log(`App bundles: ${appBundles.map(relative).join(", ")}`);
console.log(`Zip artifacts: ${zipArtifacts.length > 0 ? zipArtifacts.map(relative).join(", ") : "none"}`);
