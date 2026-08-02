#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { autoCheckForUpdates, isAutoUpdateDisabled } from './utils/auto-update.js';

// Import commands
import regionsCommand from './commands/regions.js';
import provincesCommand from './commands/provinces.js';
import municitiesCommand from './commands/municities.js';
import barangaysCommand from './commands/barangays.js';
import configCommand from './commands/config.js';
import updateCommand from './commands/update.js';
import politiciansCommand from './commands/politicians.js';

// Load package.json manually
const pkgPath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const program = new Command();

program
    .name('gis.ph')
    .description('CLI tool for GIS.PH API')
    .version(pkg.version);

// Add commands
program.addCommand(regionsCommand);
program.addCommand(provincesCommand);
program.addCommand(municitiesCommand);
program.addCommand(barangaysCommand);
program.addCommand(politiciansCommand);
program.addCommand(configCommand);
program.addCommand(updateCommand);

// Handle unknown commands
program.on('command:*', () => {
    console.error(chalk.red(`\nInvalid command: ${program.args.join(' ')}`));
    console.log(chalk.yellow(`See --help for a list of available commands.\n`));
    process.exit(1);
});

// Check for updates in background (non-blocking)
if (!isAutoUpdateDisabled()) {
    autoCheckForUpdates().catch(() => {
        // Silently fail - don't interrupt user
    });
}

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
