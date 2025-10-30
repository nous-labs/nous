#!/usr/bin/env node

const inquirer = require("inquirer");
const { spawnSync } = require("child_process");
const { existsSync, mkdirSync, readdirSync, copyFileSync } = require("fs");
const path = require("path");

const args = process.argv.slice(2);
let projectName = null;
let pmOption;
let force = false;
let skipInstall = false;
let skipLint = false;

for (const arg of args) {
  if (!arg.startsWith("--") && !projectName) {
    projectName = arg;
    continue;
  }
  if (arg.startsWith("--pm=")) {
    pmOption = arg.split("=")[1];
    continue;
  }
  if (arg === "--force") {
    force = true;
    continue;
  }
  if (arg === "--skip-install") {
    skipInstall = true;
    continue;
  }
  if (arg === "--skip-lint") {
    skipLint = true;
    continue;
  }
}

async function promptOptions() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "project",
      message: "Project directory:",
      default: projectName ?? "qubic-next-app",
      validate: (input) =>
        input && /^(?:[a-zA-Z0-9._-]+)$/.test(input)
          ? true
          : "Use alphanumeric characters, dots, dashes, or underscores only.",
      when: () => !projectName,
    },
    {
      type: "list",
      name: "pm",
      message: "Package manager:",
      default: pmOption ?? "bun",
      choices: [
        { name: "bun", value: "bun" },
        { name: "pnpm", value: "pnpm" },
        { name: "npm", value: "npm" },
        { name: "yarn", value: "yarn" },
      ],
      when: () => !pmOption,
    },
    {
      type: "confirm",
      name: "install",
      message: "Install dependencies after scaffolding?",
      default: !skipInstall,
      when: () => !skipInstall,
    },
    {
      type: "confirm",
      name: "lint",
      message: "Run lint after setup?",
      default: !skipLint,
      when: () => !skipLint,
    },
  ]);

  return {
    project: projectName ?? answers.project,
    pm: pmOption ?? answers.pm,
    install: skipInstall ? false : answers.install,
    lint: skipLint ? false : answers.lint,
  };
}

function ensureBun() {
  const result = spawnSync("bun", ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("bun is required for scaffolding. Install Bun from https://bun.sh and try again.");
    process.exit(1);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(${command}  failed.);
  }
}

function copyOverlay(srcDir, destDir) {
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }
      copyOverlay(srcPath, destPath);
    } else {
      const parent = path.dirname(destPath);
      if (!existsSync(parent)) {
        mkdirSync(parent, { recursive: true });
      }
      copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  ensureBun();
  const opts = await promptOptions();
  const targetDir = path.resolve(process.cwd(), opts.project);

  if (existsSync(targetDir)) {
    if (!force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: Directory "" already exists. Overwrite?,
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log("Aborted.");
        process.exit(1);
      }
    }
  }

  console.log(\nScaffolding Next.js app in ...);
  runCommand("bun", [
    "create",
    "next-app",
    opts.project,
    "--ts",
    "--tailwind",
  ]);

  const templateDir = path.resolve(__dirname, "../packages/cli/templates/nextjs-web");
  copyOverlay(templateDir, targetDir);

  const pm = opts.pm;
  const pmConfigs = {
    bun: {
      install: ["install"],
      add: (deps) => ["add", ...deps],
      lint: ["run", "lint"],
    },
    pnpm: {
      install: ["install"],
      add: (deps) => ["add", ...deps],
      lint: ["lint"],
    },
    npm: {
      install: ["install"],
      add: (deps) => ["install", ...deps, "--save"],
      lint: ["run", "lint"],
    },
    yarn: {
      install: ["install"],
      add: (deps) => ["add", ...deps],
      lint: ["lint"],
    },
  };

  const pmConfig = pmConfigs[pm];
  if (!pmConfig) {
    throw new Error(Unsupported package manager: );
  }

  if (opts.install ?? true) {
    console.log(\nInstalling dependencies using ...);
    runCommand(pm, pmConfig.install, { cwd: targetDir });
  }

  console.log(\nAdding Nous Labs dependencies with ...);
  const deps = ["@nouslabs/sdk", "@nouslabs/react", "@tanstack/react-query"];
  runCommand(pm, pmConfig.add(deps), { cwd: targetDir });

  if (opts.lint ?? true) {
    console.log("\nRunning lint to verify setup...");
    runCommand(pm, pmConfig.lint, { cwd: targetDir });
  }

  console.log("\nDone! Next steps:");
  console.log(  cd );
  console.log("  cp env.example .env.local");
  console.log("  npm run dev   # or pnpm/bun/yarn");
  console.log("\nReplace NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local before connecting wallets.");
}

main().catch((error) => {
  console.error("\nScaffolding failed:", error.message);
  process.exit(1);
});
