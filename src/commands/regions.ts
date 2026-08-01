import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';
import { formatListFooter, unwrapList, unwrapOne } from '../utils/api-response.js';

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
        .option('-p, --page <number>', 'Page number')
        .option('--filter <field:value>', 'Filter results (e.g., status:active)')
        .action(async (options) => {
            const spinner = ora('Fetching regions...').start();

            try {
                const params: any = {};
                if (options.limit) {
                    params.limit = parseInt(options.limit, 10);
                }
                if (options.page) {
                    params.page = parseInt(options.page, 10);
                }
                if (options.filter) {
                    const [field, value] = options.filter.split(':');
                    params[field] = value;
                }

                const response = await apiClient.getRegions(params);
                spinner.succeed('Regions fetched successfully');

                if (options.format === 'json') {
                    console.log(formatJson(response));
                    return;
                }

                const { items: regions, meta } = unwrapList(response);

                if (regions.length === 0) {
                    console.log(chalk.yellow('\nNo regions found.\n'));
                    return;
                }

                const tableData = regions.map((region: any) => ({
                    ID: region.id || 'N/A',
                    Name: region.name || 'N/A',
                    Title: region.title || region.designation || 'N/A',
                    Code: region.code || 'N/A',
                }));

                console.log(formatTable(tableData));
                console.log(chalk.gray(formatListFooter(meta, regions.length, 'region(s)')));
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
        .argument('<id>', 'Region ID or PSGC code')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching region ${id}...`).start();

            try {
                const data = await apiClient.getRegionById(id);
                spinner.succeed(`Region ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(data));
                    return;
                }

                const region = unwrapOne(data);
                const tableData = Object.entries(region as object).map(([key, value]) => ({
                    Field: key,
                    Value: typeof value === 'object' ? JSON.stringify(value) : value,
                }));

                console.log(formatTable(tableData));
            } catch (error: any) {
                spinner.fail(`Failed to fetch region ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default regionsCommand;
