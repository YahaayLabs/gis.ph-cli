import chalk from 'chalk';
import { getConfig } from './config.js';
// We'll import type if needed, but for now we'll use any or dynamic import if there's a circular dependency
// Actually, it's better to move common types to a separate file.

export async function autoCheckForUpdates() {
    try {
        const config = getConfig();
        const lastCheck = config.get('lastUpdateCheck') as number;
        const now = Date.now();

        // Check once per day (24 hours)
        const ONE_DAY = 24 * 60 * 60 * 1000;

        if (lastCheck && (now - lastCheck) < ONE_DAY) {
            return; // Too soon, skip check
        }

        // Update last check time
        config.set('lastUpdateCheck', now);

        // Lazy import to avoid circular dependency if update.ts imports this
        const { checkForUpdates } = await import('../commands/update.js');

        // Check for updates (non-verbose, don't show spinner)
        const updateInfo = await checkForUpdates(false);

        if (updateInfo.updateAvailable) {
            // Show notification at the end of command output
            setTimeout(() => {
                console.log(chalk.yellow('\n┌─────────────────────────────────────────┐'));
                console.log(chalk.yellow('│  🎉 Update Available!                   │'));
                console.log(chalk.yellow('│                                         │'));
                console.log(chalk.gray(`│  Current: ${updateInfo.currentVersion.padEnd(28)} │`));
                console.log(chalk.green(`│  Latest:  ${updateInfo.latestVersion.padEnd(28)} │`));
                console.log(chalk.yellow('│                                         │'));
                console.log(chalk.cyan(`│  Run ${chalk.bold('gis.ph update')} to upgrade        │`));
                console.log(chalk.yellow('└─────────────────────────────────────────┘\n'));
            }, 100);
        }
    } catch (error) {
        // Silently fail - don't interrupt user's workflow
    }
}

export function disableAutoUpdateCheck() {
    const config = getConfig();
    config.set('autoUpdateCheckDisabled', true);
}

export function enableAutoUpdateCheck() {
    const config = getConfig();
    config.set('autoUpdateCheckDisabled', false);
}

export function isAutoUpdateDisabled() {
    const config = getConfig();
    return config.get('autoUpdateCheckDisabled') === true;
}
