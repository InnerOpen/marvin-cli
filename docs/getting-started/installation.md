# Installation

This guide covers installing the Marvin CLI on your system.

## Prerequisites

Before installing, ensure you have:

- **Node.js 18 or higher** - Check with `node --version`
- **npm or yarn** - Package manager (comes with Node.js)
- **A running Marvin instance** - Local or remote
- **Credentials** - Site client token or user credentials (see [Configuration](configuration.md))

## Installation Methods

### Global Installation (Recommended)

Install globally to use `marvin` from anywhere:

```bash
npm install -g @inneropen/marvin-cli
```

Verify installation:

```bash
marvin --version
```

### Local Development Installation

For development or contributing to the CLI:

```bash
# Clone the repository
git clone https://github.com/inneropen/marvin-cli.git
cd marvin-cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally
npm link
```

After linking, you can run `marvin` from any directory.

### Running Without Installation

You can run the CLI directly with npx:

```bash
npx @inneropen/marvin-cli publish entries
```

This downloads and runs the latest version without installing globally.

## Verify Installation

Check that the CLI is installed correctly:

```bash
# Check version
marvin --version

# Show help
marvin --help

# List available commands
marvin --help
```

Expected output:

```
Official CLI for Marvin CMS

Usage: marvin [options] [command]

Options:
  -V, --version              output the version number
  --api-url <url>           Marvin API URL, overrides MARVIN_API_URL
  --workspace <slug>        Workspace slug, overrides MARVIN_WORKSPACE_SLUG
  --output <format>         Output format: table, json, yaml, csv (default: "table")
  --json                    Shortcut for --output json
  --yaml                    Shortcut for --output yaml
  --csv                     Shortcut for --output csv
  -h, --help                display help for command

Commands:
  publish                   Publishing API commands (read-only, requires site token)
  platform                  Platform API commands (requires user authentication)
  admin                     Admin API commands (requires admin privileges)
  auth                      Authentication commands
  help [command]            display help for command
```

## Upgrading

To upgrade to the latest version:

```bash
# Global installation
npm update -g @inneropen/marvin-cli

# Or reinstall
npm install -g @inneropen/marvin-cli@latest
```

Check for updates:

```bash
npm outdated -g @inneropen/marvin-cli
```

## Uninstalling

To remove the CLI:

```bash
# Global installation
npm uninstall -g @inneropen/marvin-cli

# Local development
npm unlink
```

## Troubleshooting Installation

### Permission Errors (macOS/Linux)

If you get permission errors during global installation:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @inneropen/marvin-cli

# Option 2: Configure npm to use a different directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Then install without sudo
npm install -g @inneropen/marvin-cli
```

### Node Version Errors

If you get errors about Node version:

```bash
# Check your Node version
node --version

# Upgrade Node.js (using nvm)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

### Command Not Found

If `marvin` command is not found after installation:

```bash
# Check npm global bin directory
npm bin -g

# Make sure it's in your PATH
echo $PATH

# Add to PATH if needed (macOS/Linux)
echo 'export PATH=$(npm bin -g):$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Build Errors (Development)

If you encounter build errors during development:

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Next Steps

After installation:

1. [Configure your credentials](configuration.md)
2. [Follow the Quick Start guide](quickstart.md)
3. [Explore available commands](../commands/overview.md)

## System Requirements

| Requirement | Version |
|------------|---------|
| Node.js | 18.0.0 or higher |
| npm | 9.0.0 or higher |
| Operating System | macOS, Linux, Windows 10+ |
| Disk Space | ~50MB |

## Related

- [Configuration Guide](configuration.md)
- [Quick Start](quickstart.md)
- [Troubleshooting](../reference/error-handling.md)
