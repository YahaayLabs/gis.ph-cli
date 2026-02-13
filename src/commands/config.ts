import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { enableAutoUpdateCheck, disableAutoUpdateCheck, isAutoUpdateDisabled } from '../utils/auto-update.js';

const configCommand = new Command('config');

configCommand
    .description('Manage CLI configuration')
    .addCommand(createSetCommand())
    .addCommand(createGetCommand())
    .addCommand(createListCommand())
    .addCommand(createDeleteCommand())
    .addCommand(createAutoUpdateCommand());

function createSetCommand() {
    return new Command('set')
        .description('Set a configuration value')
        .argument('<key>', 'Configuration key (apiUrl, apiKey)')
        .argument('<value>', 'Configuration value')
        .action((key: string, value: string) => {
            const config = getConfig();
            config.set(key, value);
            console.log(chalk.green(`✓ Configuration updated: ${key} = ${maskSensitive(key, value)}`));
        });
}

function createGetCommand() {
    return new Command('get')
        .description('Get a configuration value')
        .argument('<key>', 'Configuration key')
        .action((key: string) => {
            const config = getConfig();
            const value = config.get(key);

            if (value === undefined) {
                console.log(chalk.yellow(`Configuration key "${key}" not found`));
            } else {
                console.log(chalk.cyan(`${key}:`), maskSensitive(key, value as string));
            }
        });
}

function createListCommand() {
    return new Command('list')
        .description('List all configuration values')
        .action(() => {
            const config = getConfig();
            const store = config.store;

            if (Object.keys(store).length === 0) {
                console.log(chalk.yellow('No configuration set'));
                return;
            }

            console.log(chalk.bold('\nCurrent Configuration:'));
            Object.entries(store).forEach(([key, value]) => {
                // Skip internal keys
                if (key.startsWith('last') || key === 'autoUpdateCheckDisabled') {
                    return;
                }
                console.log(chalk.cyan(`  ${key}:`), maskSensitive(key, value as string));
            });

            // Show auto-update status
            const autoUpdateDisabled = isAutoUpdateDisabled();
            console.log(chalk.cyan(`  Auto-update checks:`), autoUpdateDisabled ? chalk.red('disabled') : chalk.green('enabled'));

            console.log();
        });
}

function createDeleteCommand() {
    return new Command('delete')
        .description('Delete a configuration value')
        .argument('<key>', 'Configuration key')
        .action((key: string) => {
            const config = getConfig();
            config.delete(key);
            console.log(chalk.green(`✓ Configuration deleted: ${key}`));
        });
}

function createAutoUpdateCommand() {
    return new Command('auto-update')
        .description('Enable or disable automatic update checks')
        .argument('<action>', 'Action: enable or disable')
        .action((action: string) => {
            if (action === 'enable') {
                enableAutoUpdateCheck();
                console.log(chalk.green('✓ Automatic update checks enabled'));
                console.log(chalk.gray('  The CLI will check for updates once per day\n'));
            } else if (action === 'disable') {
                disableAutoUpdateCheck();
                console.log(chalk.yellow('✓ Automatic update checks disabled'));
                console.log(chalk.gray('  You can still manually check with: gis.ph update --check\n'));
            } else {
                console.log(chalk.red(`Invalid action: ${action}`));
                console.log(chalk.yellow('Usage: gis.ph config auto-update <enable|disable>\n'));
            }
        });
}

function maskSensitive(key: string, value: string): string {
    if (!value) return '(not set)';
    const sensitiveKeys = ['apiKey', 'apikey', 'api_key', 'token', 'password', 'secret'];
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        return value ? '***' + value.slice(-4) : '(not set)';
    }
    return value;
}

export default configCommand;
