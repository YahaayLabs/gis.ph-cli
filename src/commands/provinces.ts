import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';

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
                    limit: parseInt(options.limit),
                    page: parseInt(options.page)
                };

                const response = await apiClient.getProvinces(params);
                spinner.succeed('Provinces fetched successfully');

                if (options.format === 'json') {
                    console.log(formatJson(response));
                } else {
                    const provinces = response.data || [];
                    const meta = response.meta || {};

                    if (provinces.length === 0) {
                        console.log(chalk.yellow('\nNo provinces found.\n'));
                        return;
                    }

                    const tableData = provinces.map((province: any) => ({
                        ID: province.id || 'N/A',
                        Name: province.name || 'N/A',
                        Code: province.code || 'N/A',
                        RegionID: province.region_id || 'N/A',
                    }));

                    console.log(formatTable(tableData));

                    if (meta.page) {
                        console.log(chalk.gray(`Page ${meta.page} of ${meta.totalPages || '?'} | Total: ${meta.total || provinces.length} province(s)`));
                    } else {
                        console.log(chalk.gray(`\nTotal: ${provinces.length} province(s)\n`));
                    }
                }
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
        .argument('<id>', 'Province ID')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .option('-g, --geometry', 'Include GeoJSON boundaries', false)
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching province ${id}...`).start();

            try {
                const params: any = {};
                if (options.geometry) {
                    params.geometry = 'true';
                }

                const response = await apiClient.getProvinceById(id, params);
                spinner.succeed(`Province ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(response));
                } else {
                    const province = response.data || response;
                    const tableData = Object.entries(province).map(([key, value]) => ({
                        Field: key,
                        Value: typeof value === 'object' ? JSON.stringify(value) : value,
                    }));

                    console.log(formatTable(tableData));

                    if (response.geojson) {
                        console.log(chalk.green('\nGeoJSON boundaries included in response.\n'));
                    }
                }
            } catch (error: any) {
                spinner.fail(`Failed to fetch province ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default provincesCommand;
