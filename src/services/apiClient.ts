import { ApiKey } from '../types';

class ApiClient {
  private apiKey: ApiKey | null;

  constructor(apiKey: ApiKey | null) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey.key}`;
    }
    return headers;
  }

  private buildUrl(endpoint: string): string {
    if (!this.apiKey) throw new Error('API key not configured');
    return `${this.apiKey.host}${endpoint}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }
}

let apiClientInstance: ApiClient | null = null;

export const initializeApiClient = (apiKey: ApiKey | null) => {
  apiClientInstance = new ApiClient(apiKey);
};

export const getApiClient = (): ApiClient => {
  if (!apiClientInstance) {
    throw new Error('API client not initialized');
  }
  return apiClientInstance;
};

export default ApiClient;
