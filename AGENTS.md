# Project conventions

## Before making changes

- Inspect the repository and read this `AGENTS.md` before changing files or running project commands.
- Preserve existing user files and changes. Do not overwrite, remove, or reconfigure them without explicit approval.
- Separate required setup from optional additions, and clearly identify optional work before doing it.

## Shell and package management

- Run all project and development commands in Git for Windows Bash as a login shell (`bash.exe -lc`).
- Do not run `npm`, `node`, Git, build, lint, test, or project scripts directly in PowerShell.
- When the execution environment exposes only PowerShell, use it solely to launch `C:\Program Files\Git\bin\bash.exe -lc`, and run the actual command inside Bash.
- Explicitly change to `/c/Users/juren/dev/daggerheart-tracker` inside each login-shell command before running project commands.
- Do not use non-login Git Bash (`bash.exe -c`) for project commands; its PATH resolves the Windows/WSL `bash.exe` before Git Bash and breaks npm in the Codex sandbox.
- Use npm for dependency management. Commit `package-lock.json`; do not introduce pnpm or Yarn artifacts.
- Prefer commands compatible with the developer's normal Git Bash workflow.

## Setup and change control

- During setup, make and verify one logical change at a time.
- If a setup or development command fails unexpectedly, stop and explain the failure before attempting a workaround.
- Do not substitute package managers, frameworks, tools, runtimes, or configuration systems without explicit approval.
- Do not create tool-specific files or directories unless that tool is actively used by this project or the user explicitly requests them.
- Before installing dependencies, state which packages will be installed and why.
- After each setup change, report exactly what changed and whether verification passed.
