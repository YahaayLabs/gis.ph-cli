import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';
import { formatListFooter, unwrapList, unwrapOne } from '../utils/api-response.js';

const provincesCommand = new Command('provinces');

provincesCommand
    .description('Manage and view provinces')
    .addCommand(createListCommand())
    .addCommand(createGetCommand());

function createListCommand() {
    return new Command('list')
        .description('List all provinces')
        .option('-f, --format <type>', 'Output format (table|json)', 'table')
        .option('-l, --limit <number>', 'Limit number of results', '10')
        .option('-p, --page <number>', 'Page number', '1')
        .action(async (options) => {
            const spinner = ora('Fetching provinces...').start();

            try {
                const params = {
                    limit: parseInt(options.limit, 10),
                    page: parseInt(options.page, 10),
                };

                const response = await apiClient.getProvinces(params);
                spinner.succeed('Provinces fetched successfully');

                if (options.format === 'json') {
                    console.log(formatJson(response));
                    return;
                }

                const { items: provinces, meta } = unwrapList(response);

                if (provinces.length === 0) {
                    console.log(chalk.yellow('\nNo provinces found.\n'));
                    return;
                }

                const tableData = provinces.map((province: any) => ({
                    ID: province.id || 'N/A',
                    Name: province.name || 'N/A',
                    Code: province.code || 'N/A',
                    RegionID: province.region_id || province.r_code || 'N/A',
                }));

                console.log(formatTable(tableData));
                console.log(chalk.gray(formatListFooter(meta, provinces.length, 'province(s)')));
            } catch (error: any) {
                spinner.fail('Failed to fetch provinces');
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

function createGetCommand() {
    return new Command('get')
        .description('Get details of a specific province')
        .argument('<id>', 'Province ID or PSGC code')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .option('-g, --geometry', 'Include GeoJSON boundaries', false)
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching province ${id}...`).start();

            try {
                const params: any = {};
                if (options.geometry) {
                    params.geometry = 'simple';
                }

                const response = await apiClient.getProvinceById(id, params);
                spinner.succeed(`Province ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(response));
                    return;
                }

                const province = unwrapOne(response);
                const tableData = Object.entries(province as object).map(([key, value]) => ({
                    Field: key,
                    Value: typeof value === 'object' ? JSON.stringify(value) : value,
                }));

                console.log(formatTable(tableData));
            } catch (error: any) {
                spinner.fail(`Failed to fetch province ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default provincesCommand;
