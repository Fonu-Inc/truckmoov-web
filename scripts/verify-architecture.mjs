import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const errors = [];

function walkFiles(dirPath, extensions = [".ts", ".tsx"]) {
  if (!statSafe(dirPath)?.isDirectory()) return [];

  const out = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(fullPath, extensions));
      continue;
    }

    if (extensions.includes(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }

  return out;
}

function statSafe(targetPath) {
  try {
    return statSync(targetPath);
  } catch {
    return null;
  }
}

function relativeFile(targetPath) {
  return path.relative(rootDir, targetPath).replaceAll(path.sep, "/");
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function verifyPageShims() {
  const pageFiles = walkFiles(path.join(rootDir, "src/pages"));
  const shimPattern = /export\s+\{\s*default\s*\}\s+from\s+["']@\/features\/[^"']+["'];?/m;

  for (const file of pageFiles) {
    const content = read(file);
    assert(
      shimPattern.test(content),
      `${relativeFile(file)} must remain a compatibility shim that re-exports from src/features.`,
    );
  }
}

function verifyLegacyComponentShims() {
  const shimDirs = [
    "src/components/platform",
    "src/components/supervisor",
    "src/components/owner-operator",
    "src/components/admin",
    "src/components/aggregator",
    "src/components/support",
  ];

  for (const dir of shimDirs) {
    const fullDir = path.join(rootDir, dir);
    for (const file of walkFiles(fullDir)) {
      const content = read(file);
      assert(
        content.includes("@/features/"),
        `${relativeFile(file)} must re-export from a feature-local component path.`,
      );
    }
  }
}

function verifyMigratedHookShims() {
  const migratedHooks = [
    "src/hooks/useTenants.ts",
    "src/hooks/usePlatformAIConfig.ts",
    "src/hooks/usePlatformIntegrationGovernance.ts",
    "src/hooks/usePlatformPhoneNumbers.ts",
    "src/hooks/usePlatformSenderIdApprovals.ts",
    "src/hooks/useTenantDashboard.ts",
    "src/hooks/useSupervisorData.ts",
    "src/hooks/useOwnerOperatorJobLimit.ts",
    "src/hooks/useOwnerOperatorVehicleCap.ts",
    "src/hooks/useSupportTickets.ts",
    "src/hooks/useSupportPermissions.ts",
  ];

  for (const hookPath of migratedHooks) {
    const file = path.join(rootDir, hookPath);
    const exists = statSafe(file)?.isFile();
    assert(Boolean(exists), `${hookPath} is missing.`);
    if (!exists) continue;

    const content = read(file);
    assert(
      content.includes("@/features/"),
      `${hookPath} must remain a compatibility shim that re-exports from src/features.`,
    );
  }
}

function verifyNoFeatureToLegacyPageImports() {
  const routeAndAppFiles = [
    path.join(rootDir, "src/App.tsx"),
    ...walkFiles(path.join(rootDir, "src/features")),
  ];

  for (const file of routeAndAppFiles) {
    const content = read(file);
    const importsLegacyPages =
      content.includes("@/pages/") || content.includes("./pages/") || content.includes("../pages/");
    assert(!importsLegacyPages, `${relativeFile(file)} imports from src/pages, which breaks feature ownership.`);
  }
}

verifyPageShims();
verifyLegacyComponentShims();
verifyMigratedHookShims();
verifyNoFeatureToLegacyPageImports();

if (errors.length > 0) {
  console.error("Architecture verification failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Architecture verification passed.");
