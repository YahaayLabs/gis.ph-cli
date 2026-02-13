import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * Format data as a table
 * @param {Array<any>} data - Array of objects to display
 * @returns {string} Formatted table
 */
export function formatTable(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
        return chalk.yellow('No data to display');
    }

    const headers = Object.keys(data[0]);

    const table = new Table({
        head: headers.map(h => chalk.cyan(h)),
        style: {
            head: [],
            border: ['gray'],
        },
        // @ts-ignore - cli-table3 types might be strict about colWidths
        colWidths: headers.map(() => null), // Auto-width
    });

    data.forEach(row => {
        table.push(headers.map(h => row[h] ?? ''));
    });

    return '\n' + table.toString() + '\n';
}

/**
 * Format data as pretty JSON
 * @param {*} data - Data to format
 * @returns {string} Formatted JSON
 */
export function formatJson(data: any): string {
    return '\n' + JSON.stringify(data, null, 2) + '\n';
}

/**
 * Format data as simple key-value pairs
 * @param {Object} data - Object to display
 * @returns {string} Formatted output
 */
export function formatKeyValue(data: any): string {
    if (typeof data !== 'object' || data === null) {
        return String(data);
    }

    let output = '\n';
    Object.entries(data).forEach(([key, value]) => {
        const formattedValue = typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : value;
        output += `${chalk.cyan(key + ':')} ${formattedValue}\n`;
    });

    return output;
}
