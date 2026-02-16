import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../lib/api-client.js';
import { formatTable, formatJson } from '../utils/formatter.js';

const municitiesCommand = new Command('municities');

municitiesCommand
    .description('Manage and view cities and municipalities')
    .addCommand(createListCommand())
    .addCommand(createGetCommand());

function createListCommand() {
    return new Command('list')
        .description('List cities and municipalities in a province')
        .requiredOption('-r, --province <name>', 'Exact name of the province (required)')
        .option('-n, --name <query>', 'Filter by city/municipality name (starts with)')
        .option('-f, --format <type>', 'Output format (table|json)', 'table')
        .option('-l, --limit <number>', 'Limit number of results', '10')
        .option('-p, --page <number>', 'Page number', '1')
        .action(async (options) => {
            const spinner = ora(`Fetching cities/municipalities for ${options.province}...`).start();

            try {
                const params: any = {
                    province: options.province,
                    limit: parseInt(options.limit),
                    page: parseInt(options.page)
                };

                if (options.name) {
                    params.name = options.name;
                }

                const response = await apiClient.getMuniCities(params);
                spinner.succeed('Data fetched successfully');

                if (options.format === 'json') {
                    console.log(formatJson(response));
                } else {
                    const data = response.data || [];
                    const meta = response.meta || {};

                    if (data.length === 0) {
                        console.log(chalk.yellow('\nNo cities or municipalities found.\n'));
                        return;
                    }

                    const tableData = data.map((item: any) => ({
                        ID: item.id || 'N/A',
                        Name: item.name || 'N/A',
                        Type: item.type || 'N/A',
                        Province: typeof item.province === 'object' ? item.province.name : (item.province || 'N/A'),
                    }));

                    console.log(formatTable(tableData));

                    if (meta.page) {
                        console.log(chalk.gray(`Page ${meta.page} of ${meta.totalPages || '?'} | Total: ${meta.total || data.length} item(s)`));
                    } else {
                        console.log(chalk.gray(`\nTotal: ${data.length} item(s)\n`));
                    }
                }
            } catch (error: any) {
                spinner.fail('Failed to fetch data');
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

function createGetCommand() {
    return new Command('get')
        .description('Get details of a specific city or municipality')
        .argument('<id>', 'Municipality ID')
        .option('-f, --format <type>', 'Output format (table|json)', 'json')
        .option('-g, --geometry', 'Include GeoJSON boundaries (barangays)', false)
        .action(async (id: string, options) => {
            const spinner = ora(`Fetching municipality ${id}...`).start();

            try {
                const params: any = {};
                if (options.geometry) {
                    params.geometry = 'true';
                }

                const response = await apiClient.getMuniCityById(id, params);
                spinner.succeed(`Municipality ${id} fetched successfully`);

                if (options.format === 'json') {
                    console.log(formatJson(response));
                } else {
                    const data = response.data || response;
                    const tableData = Object.entries(data).map(([key, value]) => ({
                        Field: key,
                        Value: typeof value === 'object' ? JSON.stringify(value) : value,
                    }));

                    console.log(formatTable(tableData));

                    if (response.geojson) {
                        console.log(chalk.green('\nGeoJSON boundaries (barangays) included in response.\n'));
                    }
                }
            } catch (error: any) {
                spinner.fail(`Failed to fetch municipality ${id}`);
                console.error(chalk.red(`\nError: ${error.message}\n`));
                process.exit(1);
            }
        });
}

export default municitiesCommand;
