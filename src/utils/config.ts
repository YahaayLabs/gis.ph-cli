import Conf from 'conf';

interface ConfigSchema {
    apiUrl: string;
    apiKey?: string;
    lastUpdateCheck?: number;
    [key: string]: any;
}

let config: any;

export function getConfig() {
    if (!config) {
        // @ts-ignore
        config = new Conf<ConfigSchema>({
            projectName: 'gis.ph',
            defaults: {
                apiUrl: 'https://api.gis.ph',
            },
        });
    }
    return config;
}
