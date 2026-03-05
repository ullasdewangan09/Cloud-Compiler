import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(username: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  // Code execution endpoints
  async executeAsync(code: string, language: string, input: string = '') {
    const response = await this.api.post('/execute', {
      code,
      language,
      input,
    });
    return response.data;
  }

  async getExecutionResult(jobId: string) {
    const response = await this.api.get(`/execute/result/${jobId}`);
    return response.data;
  }

  async executeSync(code: string, language: string, input: string = '') {
    const response = await this.api.post('/execute/sync', {
      code,
      language,
      input,
    });
    return response.data;
  }

  async analyzeComplexity(code: string, language: string) {
    const response = await this.api.post('/complexity', {
      code,
      language,
    });
    return response.data;
  }

  // File operations
  async importFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/import-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async exportFile(filename: string, code: string, type: 'code' | 'pdf' = 'code') {
    const response = await this.api.post('/export-file', 
      {
        filename,
        code,
        type,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Metrics endpoints (admin)
  async getQueueMetrics() {
    const response = await this.api.get('/metrics/queue');
    return response.data;
  }

  async getWorkerMetrics() {
    const response = await this.api.get('/metrics/workers');
    return response.data;
  }

  async getSystemMetrics() {
    const response = await this.api.get('/metrics/system');
    return response.data;
  }

  async getJobMetrics() {
    const response = await this.api.get('/metrics/jobs');
    return response.data;
  }

  async getVisualizationDashboard() {
    const response = await this.api.get('/visualization/dashboard');
    return response.data;
  }

  // Root endpoint
  async getRoot() {
    const response = await this.api.get('/');
    return response.data;
  }
}

export const apiService = new ApiService();
