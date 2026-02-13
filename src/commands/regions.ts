import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';

const regionsCommand = new Command('regions');

regionsCommand
    .description('Manage and view regions')
    .addCommand(createListCommand())
    .addCommand(createGetCommand());

function createListCommand() {
    return new Command('list')
        .description('List all regions')
        .option('-f, --format <type>', 'Output format (table|json)', 'table')
        .option('-l, --limit <number>', 'Limit number of results')
        .option('--filter <field:value>', 'Filter results (e.g., status:active)')
        .action(async (options) => {
            const spinner = ora('Fetching regions...').start();

            try {
                // Build query parameters
                const params: any = {};
                if (options.limit) {
                    params.limit = parseInt(options.limit);
                }
                if (options.filter) {
                    const [field, value] = options.filter.split(':');
                    params[field] = value;
                }

                const data = await apiClient.getRegions(params);
                spinner.succeed('Regions fetched successfully');

                // Display results
                if (options.format === 'json') {
                    console.log(formatJson(data));
                } else {
                    // The API now returns { data: [...], error: null }
                    const regions = Array.isArray(data) ? data : ((data as any).data || (data as any).regions || []);

                    if (regions.length === 0) {
                        console.log(chalk.yellow('\nNo regions found.\n'));
                        return;
                    }

                    const tableData = regions.map((region: any) => ({
                        ID: region.id || 'N/A',
                        Name: region.name || 'N/A',
                        Title: region.title || 'N/A',
                        Code: region.code || 'N/A',
                    }));

                    console.log(formatTable(tableData));
                    console.log(chalk.gray(`\nTotal: ${regions.length} region(s)\n`));
                }
            } catch (error: any) {
                spinner.fail('Failed to fetch regions');
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

function createGetCommand() {
    return new Command('get')
        .description('Get details of a specific region')
        .argument('<id>', 'Region ID')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching region ${id}...`).start();

            try {
                const data = await apiClient.getRegionById(id);
                spinner.succeed(`Region ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(data));
                } else {
                    // The API now returns { data: {...}, error: null }
                    const region = (data as any).data || (data as any).region || data;
                    const tableData = Object.entries(region).map(([key, value]) => ({
                        Field: key,
                        Value: typeof value === 'object' ? JSON.stringify(value) : value,
                    }));

                    console.log(formatTable(tableData));
                }
            } catch (error: any) {
                spinner.fail(`Failed to fetch region ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default regionsCommand;
