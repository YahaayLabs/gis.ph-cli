import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';
import { formatListFooter, unwrapList, unwrapOne } from '../utils/api-response.js';

const barangaysCommand = new Command('barangays');

barangaysCommand
    .description('Manage and view barangays')
    .addCommand(createListCommand())
    .addCommand(createGetCommand());

function createListCommand() {
    return new Command('list')
        .description('List barangays in a province')
        .requiredOption('-r, --province <name>', 'Exact name of the province (required)')
        .option('-m, --municipality <query>', 'Filter by municipality/city name (starts with)')
        .option('-n, --name <query>', 'Filter by barangay name (starts with)')
        .option('-f, --format <type>', 'Output format (table|json)', 'table')
        .option('-l, --limit <number>', 'Limit number of results', '10')
        .option('-p, --page <number>', 'Page number', '1')
        .action(async (options) => {
            const spinner = ora(`Fetching barangays for province ${options.province}...`).start();

            try {
                const params: any = {
                    province: options.province,
                    limit: parseInt(options.limit, 10),
                    page: parseInt(options.page, 10),
                };

                if (options.municipality) {
                    params.municipality = options.municipality;
                }

                if (options.name) {
                    params.name = options.name;
                }

                const response = await apiClient.getBarangays(params);
                spinner.succeed('Barangays fetched successfully');

                if (options.format === 'json') {
                    console.log(formatJson(response));
                    return;
                }

                const { items: data, meta } = unwrapList(response);

                if (data.length === 0) {
                    console.log(chalk.yellow('\nNo barangays found.\n'));
                    return;
                }

                const tableData = data.map((item: any) => ({
                    ID: item.id || 'N/A',
                    Name: item.name || 'N/A',
                    Code: item.code || 'N/A',
                    Population: item.population ?? 'N/A',
                    MunicipalityID: item.municipality_id || item.l_code || 'N/A',
                }));

                console.log(formatTable(tableData));
                console.log(chalk.gray(formatListFooter(meta, data.length, 'barangay(s)')));
            } catch (error: any) {
                spinner.fail('Failed to fetch barangays');
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

function createGetCommand() {
    return new Command('get')
        .description('Get details of a specific barangay')
        .argument('<id>', 'Barangay ID or PSGC code')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching barangay ${id}...`).start();

            try {
                const response = await apiClient.getBarangayById(id);
                spinner.succeed(`Barangay ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(response));
                    return;
                }

                const data = unwrapOne(response);
                const tableData = Object.entries(data as object).map(([key, value]) => ({
                    Field: key,
                    Value: typeof value === 'object' ? JSON.stringify(value) : value,
                }));

                console.log(formatTable(tableData));
            } catch (error: any) {
                spinner.fail(`Failed to fetch barangay ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default barangaysCommand;
