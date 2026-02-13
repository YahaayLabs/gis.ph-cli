import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../utils/config.js';

class ApiClient {
    private client: AxiosInstance;
    private baseURL: string;
    private apiKey?: string;

    constructor() {
        const config = getConfig();

        this.baseURL = (config.get('apiUrl') as string) || process.env.API_URL || 'http://localhost:3000';
        this.apiKey = (config.get('apiKey') as string) || process.env.API_KEY;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor for authentication
        this.client.interceptors.request.use(
            (conf) => {
                if (this.apiKey) {
                    conf.headers['Authorization'] = `Bearer ${this.apiKey}`;
                }
                return conf;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    // Server responded with error status
                    const message = error.response.data?.message || error.response.statusText;
                    throw new Error(`API Error (${error.response.status}): ${message}`);
                } else if (error.request) {
                    // Request made but no response
                    throw new Error(`Network Error: Unable to reach API at ${this.baseURL}`);
                } else {
                    // Something else happened
                    throw new Error(`Request Error: ${error.message}`);
                }
            }
        );
    }

    async get<T = any>(endpoint: string, params: any = {}): Promise<T> {
        const response = await this.client.get(endpoint, { params });
        return response.data;
    }

    async post<T = any>(endpoint: string, data: any = {}): Promise<T> {
        const response = await this.client.post(endpoint, data);
        return response.data;
    }

    async put<T = any>(endpoint: string, data: any = {}): Promise<T> {
        const response = await this.client.put(endpoint, data);
        return response.data;
    }

    async delete<T = any>(endpoint: string): Promise<T> {
        const response = await this.client.delete(endpoint);
        return response.data;
    }

    // Specific API methods
    async getRegions(params: any = {}) {
        return this.get('/v1/regions', params);
    }

    async getRegionById(id: string | number) {
        return this.get(`/v1/regions/${id}`);
    }
}

export default new ApiClient();
