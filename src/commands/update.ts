import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load package.json manually to avoid issues with JSON modules in some environments
// Or use dynamic import / require if needed for ESM
const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const updateCommand = new Command('update');

updateCommand
    .description('Update the CLI to the latest version')
    .option('--check', 'Check for updates without installing')
    .option('--force', 'Force update even if already on latest version')
    .action(async (options: any) => {
        if (options.check) {
            await checkForUpdates(true);
        } else {
            await performUpdate(options.force);
        }
    });

/**
 * Check for available updates
 */
export async function checkForUpdates(verbose = false): Promise<any> {
    const spinner = verbose ? ora('Checking for updates...').start() : null;

    try {
        const latestVersion = await getLatestVersion();
        const currentVersion = pkg.version;

        if (spinner) spinner.succeed('Update check complete');

        const isNewer = compareVersions(latestVersion, currentVersion) > 0;

        if (isNewer) {
            if (verbose) {
                console.log(chalk.yellow(`\n🎉 Update available!`));
                console.log(chalk.gray(`   Current: ${currentVersion}`));
                console.log(chalk.green(`   Latest:  ${latestVersion}`));
                console.log(chalk.cyan(`\n   Run ${chalk.bold('gis.ph update')} to upgrade\n`));
            }
            return { updateAvailable: true, currentVersion, latestVersion };
        } else {
            if (verbose) {
                console.log(chalk.green(`\n✓ You're on the latest version (${currentVersion})\n`));
            }
            return { updateAvailable: false, currentVersion, latestVersion };
        }
    } catch (error: any) {
        if (spinner) spinner.fail('Failed to check for updates');
        if (verbose) {
            console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        return { updateAvailable: false, error: error.message };
    }
}

/**
 * Get latest version from GitHub
 */
export function getLatestVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        // Update this URL to match your GitHub repo
        const GITHUB_REPO = process.env.GITHUB_REPO || 'yourusername/my-api-cli';
        const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

        https.get(url, {
            headers: {
                'User-Agent': 'MyAPI-CLI'
            }
        }, (res: any) => {
            let data = '';

            res.on('data', (chunk: any) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 404) {
                        // No releases, try to get from package.json on main branch
                        getVersionFromMain(GITHUB_REPO)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    if (res.statusCode !== 200) {
                        reject(new Error(`GitHub API returned status ${res.statusCode}`));
                        return;
                    }

                    const release = JSON.parse(data);
                    const version = release.tag_name.replace(/^v/, '');
                    resolve(version);
                } catch (error) {
                    reject(new Error('Failed to parse GitHub response'));
                }
            });
        }).on('error', (error: any) => {
            reject(new Error(`Failed to check version: ${error.message}`));
        });
    });
}

/**
 * Get version from package.json on main branch (fallback)
 */
function getVersionFromMain(repo: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = `https://raw.githubusercontent.com/${repo}/main/package.json`;

        https.get(url, {
            headers: {
                'User-Agent': 'MyAPI-CLI'
            }
        }, (res: any) => {
            let data = '';

            res.on('data', (chunk: any) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error('Could not fetch version from GitHub'));
                        return;
                    }

                    const packageJson = JSON.parse(data);
                    resolve(packageJson.version);
                } catch (error) {
                    reject(new Error('Failed to parse package.json from GitHub'));
                }
            });
        }).on('error', (error: any) => {
            reject(error);
        });
    });
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }

    return 0;
}

/**
 * Perform the update
 */
async function performUpdate(force = false) {
    console.log(chalk.blue('\n🔄 Updating CLI...\n'));

    // Check for updates first
    if (!force) {
        const updateInfo = await checkForUpdates(false);

        if (!updateInfo.updateAvailable) {
            console.log(chalk.green(`✓ Already on the latest version (${updateInfo.currentVersion})\n`));
            console.log(chalk.gray(`Use --force to reinstall anyway\n`));
            return;
        }
    }

    const spinner = ora('Downloading latest version...').start();

    try {
        // Get installation directory
        const installDir = getInstallDir();

        if (!installDir) {
            spinner.fail('Update failed');
            console.error(chalk.red('\nError: Could not determine installation directory'));
            console.log(chalk.yellow('\nPlease reinstall using:'));
            console.log(chalk.cyan('curl -fsSL https://gis.ph/install.sh | bash\n'));
            process.exit(1);
        }

        spinner.text = 'Updating...';

        // Run the update script
        const GITHUB_REPO = process.env.GITHUB_REPO || 'yourusername/my-api-cli';
        const DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.tar.gz`;

        // Use the same update logic as install script
        const updateScript = `
      set -e
      TEMP_DIR=$(mktemp -d)
      TEMP_FILE="$TEMP_DIR/cli.tar.gz"
      INSTALL_DIR="${installDir}"
      
      # Download
      if command -v curl &> /dev/null; then
        curl -fsSL "${DOWNLOAD_URL}" -o "$TEMP_FILE"
      else
        wget -q "${DOWNLOAD_URL}" -O "$TEMP_FILE"
      fi
      
      # Backup current installation
      if [ -d "$INSTALL_DIR.backup" ]; then
        rm -rf "$INSTALL_DIR.backup"
      fi
      cp -r "$INSTALL_DIR" "$INSTALL_DIR.backup"
      
      # Extract to temp location
      EXTRACT_DIR="$TEMP_DIR/extract"
      mkdir -p "$EXTRACT_DIR"
      tar -xzf "$TEMP_FILE" -C "$EXTRACT_DIR"
      
      # Find extracted directory
      EXTRACTED_DIR=$(find "$EXTRACT_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)
      
      # Move files
      rm -rf "$INSTALL_DIR"
      mv "$EXTRACTED_DIR" "$INSTALL_DIR"
      
      # Install dependencies
      cd "$INSTALL_DIR"
      npm install --production --silent
      
      # Clean up
      rm -rf "$TEMP_DIR"
      rm -rf "$INSTALL_DIR.backup"
    `;

        execSync(updateScript, {
            stdio: 'pipe',
            shell: '/bin/bash'
        });

        spinner.succeed('Update complete!');

        // Get new version
        const newPackageJson = JSON.parse(
            fs.readFileSync(path.join(installDir, 'package.json'), 'utf8')
        );

        console.log(chalk.green(`\n✓ Successfully updated to version ${newPackageJson.version}\n`));
        console.log(chalk.gray('Changes will take effect immediately.\n'));

    } catch (error: any) {
        spinner.fail('Update failed');
        console.error(chalk.red(`\nError: ${error.message}`));
        console.log(chalk.yellow('\nIf the problem persists, try reinstalling:'));
        console.log(chalk.cyan('curl -fsSL https://gis.ph/install.sh | bash\n'));
        process.exit(1);
    }
}

/**
 * Get CLI installation directory
 */
function getInstallDir(): string | null {
    // Method 1: Try from config file (set during installation)
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const configPath = path.join(homeDir, '.config', 'myapi', 'install_dir');
    if (fs.existsSync(configPath)) {
        const installDir = fs.readFileSync(configPath, 'utf8').trim();
        if (installDir && fs.existsSync(installDir)) {
            return installDir;
        }
    }

    // Method 2: Try environment variable
    if (process.env.MYAPI_INSTALL_DIR && fs.existsSync(process.env.MYAPI_INSTALL_DIR)) {
        return process.env.MYAPI_INSTALL_DIR;
    }

    // Method 3: Try common installation paths
    const possiblePaths = [
        path.join(homeDir, '.myapi'),
        path.join(homeDir, '.my-api-cli'),
    ];

    for (const dir of possiblePaths) {
        if (dir && fs.existsSync(dir) && fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
    }

    // Method 4: Try to get from the current executable path
    const binPath = process.argv[1];
    if (binPath && fs.existsSync(binPath)) {
        try {
            if (fs.lstatSync(binPath).isSymbolicLink()) {
                const realPath = fs.realpathSync(binPath);
                const installDir = path.dirname(path.dirname(realPath));
                if (fs.existsSync(path.join(installDir, 'package.json'))) {
                    return installDir;
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }

    return null;
}

export default updateCommand;
