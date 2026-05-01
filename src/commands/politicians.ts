import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';

const politiciansCommand = new Command('politicians');

politiciansCommand
  .description('Manage and view politicians')
  .addCommand(createListCommand())
  .addCommand(createSearchCommand())
  .addCommand(createGetCommand())
  .addCommand(createAliasesCommand())
  .addCommand(createMembershipsCommand())
  .addCommand(createTenuresCommand())
  .addCommand(createCurrentPositionsCommand());

function createListCommand() {
  return new Command('list')
    .description('List all politicians')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-p, --page <number>', 'Page number', '1')
    .action(async (options) => {
      const spinner = ora('Fetching politicians...').start();

      try {
        const params = {
          limit: parseInt(options.limit),
          page: parseInt(options.page),
        };

        const response = await apiClient.getPoliticians(params);
        spinner.succeed('Politicians fetched successfully');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const politicians = response.data || (Array.isArray(response) ? response : []);
          const meta = response.meta || {};

          if (politicians.length === 0) {
            console.log(chalk.yellow('\nNo politicians found.\n'));
            return;
          }

          const tableData = politicians.map((p: any) => ({
            ID: p.id || 'N/A',
            'First Name': p.firstName || 'N/A',
            'Last Name': p.lastName || 'N/A',
            Gender: p.gender || 'N/A',
            Nationality: p.nationality || 'N/A',
          }));

          console.log(formatTable(tableData));

          if (meta.page) {
            console.log(chalk.gray(`Page ${meta.page} of ${meta.totalPages || '?'} | Total: ${meta.total || politicians.length} politician(s)`));
          } else {
            console.log(chalk.gray(`\nTotal: ${politicians.length} politician(s)\n`));
          }
        }
      } catch (error: any) {
        spinner.fail('Failed to fetch politicians');
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createSearchCommand() {
  return new Command('search')
    .description('Search for politicians')
    .option('-q, --query <text>', 'Search query (min 2 chars)')
    .option('--gender <gender>', 'Filter by gender')
    .option('--party <uuid>', 'Filter by party ID (UUID)')
    .option('--branch <branch>', 'Filter by government branch')
    .option('--status <status>', 'Filter by status')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('--offset <number>', 'Offset for pagination', '0')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (options) => {
      const spinner = ora('Searching politicians...').start();

      try {
        const params: any = {
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        };
        if (options.query) params.q = options.query;
        if (options.gender) params.gender = options.gender;
        if (options.party) params.partyId = options.party;
        if (options.branch) params.branch = options.branch;
        if (options.status) params.status = options.status;

        const response = await apiClient.searchPoliticians(params);
        spinner.succeed('Search complete');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const politicians = Array.isArray(response) ? response : (response.data || []);

          if (politicians.length === 0) {
            console.log(chalk.yellow('\nNo politicians found.\n'));
            return;
          }

          const tableData = politicians.map((p: any) => ({
            ID: p.id || 'N/A',
            'First Name': p.firstName || 'N/A',
            'Last Name': p.lastName || 'N/A',
            Gender: p.gender || 'N/A',
            Nationality: p.nationality || 'N/A',
          }));

          console.log(formatTable(tableData));
          console.log(chalk.gray(`\nTotal results: ${politicians.length}\n`));
        }
      } catch (error: any) {
        spinner.fail('Search failed');
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createGetCommand() {
  return new Command('get')
    .description('Get details of a specific politician')
    .argument('<id>', 'Politician UUID')
    .option('-f, --format <type>', 'Output format (table|json)', 'json')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching politician ${id}...`).start();

      try {
        const response = await apiClient.getPoliticianById(id);
        spinner.succeed(`Politician fetched successfully`);

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const politician = response.data || response;
          const tableData = Object.entries(politician).map(([key, value]) => ({
            Field: key,
            Value: typeof value === 'object' ? JSON.stringify(value) : value,
          }));
          console.log(formatTable(tableData));
        }
      } catch (error: any) {
        spinner.fail(`Failed to fetch politician ${id}`);
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createAliasesCommand() {
  return new Command('aliases')
    .description('List aliases for a politician')
    .argument('<id>', 'Politician UUID')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching aliases for politician ${id}...`).start();

      try {
        const response = await apiClient.getPoliticianAliases(id);
        spinner.succeed('Aliases fetched successfully');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const aliases = Array.isArray(response) ? response : (response.data || []);

          if (aliases.length === 0) {
            console.log(chalk.yellow('\nNo aliases found.\n'));
            return;
          }

          const tableData = aliases.map((a: any) => ({
            ID: a.id || 'N/A',
            Alias: a.alias || 'N/A',
            Type: a.aliasType || 'N/A',
          }));

          console.log(formatTable(tableData));
          console.log(chalk.gray(`\nTotal: ${aliases.length} alias(es)\n`));
        }
      } catch (error: any) {
        spinner.fail(`Failed to fetch aliases for politician ${id}`);
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createMembershipsCommand() {
  return new Command('memberships')
    .description('List party memberships for a politician')
    .argument('<id>', 'Politician UUID')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching party memberships for politician ${id}...`).start();

      try {
        const response = await apiClient.getPoliticianMemberships(id);
        spinner.succeed('Party memberships fetched successfully');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const memberships = Array.isArray(response) ? response : (response.data || []);

          if (memberships.length === 0) {
            console.log(chalk.yellow('\nNo party memberships found.\n'));
            return;
          }

          const tableData = memberships.map((m: any) => ({
            ID: m.id || 'N/A',
            'Party ID': m.partyId || 'N/A',
            'Date Joined': m.dateJoined || 'N/A',
            'Date Left': m.dateLeft || 'N/A',
            Role: m.roleInParty || 'N/A',
          }));

          console.log(formatTable(tableData));
          console.log(chalk.gray(`\nTotal: ${memberships.length} membership(s)\n`));
        }
      } catch (error: any) {
        spinner.fail(`Failed to fetch party memberships for politician ${id}`);
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createTenuresCommand() {
  return new Command('tenures')
    .description('List position tenures for a politician')
    .argument('<id>', 'Politician UUID')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching tenures for politician ${id}...`).start();

      try {
        const response = await apiClient.getPoliticianTenures(id);
        spinner.succeed('Tenures fetched successfully');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const tenures = Array.isArray(response) ? response : (response.data || []);

          if (tenures.length === 0) {
            console.log(chalk.yellow('\nNo tenures found.\n'));
            return;
          }

          const tableData = tenures.map((t: any) => ({
            ID: t.id || 'N/A',
            Position: t.positionTitle || t.position || 'N/A',
            'Start Date': t.startDate || 'N/A',
            'End Date': t.endDate || 'N/A',
          }));

          console.log(formatTable(tableData));
          console.log(chalk.gray(`\nTotal: ${tenures.length} tenure(s)\n`));
        }
      } catch (error: any) {
        spinner.fail(`Failed to fetch tenures for politician ${id}`);
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

function createCurrentPositionsCommand() {
  return new Command('current-positions')
    .description('List current positions for a politician')
    .argument('<id>', 'Politician UUID')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (id: string, options) => {
      const spinner = ora(`Fetching current positions for politician ${id}...`).start();

      try {
        const response = await apiClient.getPoliticianCurrentPositions(id);
        spinner.succeed('Current positions fetched successfully');

        if (options.format === 'json') {
          console.log(formatJson(response));
        } else {
          const positions = Array.isArray(response) ? response : (response.data || []);

          if (positions.length === 0) {
            console.log(chalk.yellow('\nNo current positions found.\n'));
            return;
          }

          const tableData = positions.map((p: any) => ({
            ID: p.id || 'N/A',
            Position: p.positionTitle || p.position || 'N/A',
            'Start Date': p.startDate || 'N/A',
          }));

          console.log(formatTable(tableData));
          console.log(chalk.gray(`\nTotal: ${positions.length} position(s)\n`));
        }
      } catch (error: any) {
        spinner.fail(`Failed to fetch current positions for politician ${id}`);
        console.error(chalk.red(`\nError: ${error.message}\n`));
        process.exit(1);
      }
    });
}

export default politiciansCommand;
