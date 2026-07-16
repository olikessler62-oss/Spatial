# Spatial Developer Toolkit (SDT)

Small Windows toolkit for common Project Spatial repository tasks.

## Included functions

- Git status
- Git pull
- Commit and push
- Recent commit history
- Open the repository in VS Code
- Open GitHub
- Open project and documentation folders

## Installation

Copy the contents of this package into the root of your local `Spatial` repository.

Expected structure:

```text
Spatial/
├── spatial.bat
└── tools/
    └── devtoolkit/
        ├── spatial.bat
        ├── spatial.ps1
        ├── config.json
        └── README.md
```

## Start

From PowerShell in the repository root:

```powershell
.\spatial.bat
```

You can also double-click `spatial.bat`.

## Configuration

Edit `tools/devtoolkit/config.json` to change:

- repository URL
- default branch
- documentation paths

## Safety

`Commit + Push`:

1. shows changed files,
2. asks for a commit message,
3. asks for confirmation,
4. stages all changes,
5. refuses an empty commit,
6. commits and pushes.

It does not use `--force`.

## PowerShell execution policy

The launcher uses:

```text
-ExecutionPolicy Bypass
```

only for this process. It does not change the system-wide PowerShell execution policy.
