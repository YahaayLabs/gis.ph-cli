import Conf from 'conf';

interface ConfigSchema {
    apiUrl: string;
    apiKey?: string;
    lastUpdateCheck?: number;
    [key: string]: any;
}

let config: Conf<ConfigSchema>;

export function getConfig() {
    if (!config) {
        config = new Conf<ConfigSchema>({
            projectName: 'gis.ph',
            defaults: {
                apiUrl: 'https://api.gis.ph',
            },
        });
    }
    return config;
}
