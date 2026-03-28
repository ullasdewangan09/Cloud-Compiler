import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CodeFile {
  filename: string;
  content: string;
}

export interface Diagnostics {
  summary: string;
  details: string[];
  error_stage: string | null;
}

export interface ExecutionArtifact {
  kind: string;
  label: string;
  mime_type: string;
  base64_data: string;
  description?: string;
}

export interface ExecutionResponse {
  status: string;
  job_id?: string;
  output: string;
  stdout: string;
  stderr: string;
  error: string;
  execution_time: number | null;
  compile_time_ms: number | null;
  execution_time_ms: number | null;
  total_time_ms: number | null;
  queue_wait_ms: number | null;
  submitted_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  diagnostics: Diagnostics;
  artifacts?: ExecutionArtifact[];
  entry_file?: string | null;
  compiler_profile?: string | null;
  compiler_flags?: string;
}

export interface ExecutionRequest {
  code?: string;
  language: string;
  input?: string;
  files?: CodeFile[];
  entry_file?: string;
  compiler_profile?: string | null;
  compiler_flags?: string;
}

export interface InteractiveSessionResponse {
  status: string;
  session_id: string;
  interactive_url: string | null;
  created_at?: string;
  expires_at?: string;
  stdout: string;
  stderr: string;
  message: string;
}

export interface SavedProject {
  id: number;
  name: string;
  language: string;
  input: string;
  files: CodeFile[];
  entry_file: string;
  compiler_profile?: string | null;
  compiler_flags: string;
  is_public: boolean;
  owner_username: string;
  share_id?: string | null;
  share_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveProjectRequest {
  name: string;
  language: string;
  input: string;
  files: CodeFile[];
  entry_file: string;
  compiler_profile?: string | null;
  compiler_flags: string;
  is_public: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

  async executeAsync(payload: ExecutionRequest): Promise<ExecutionResponse> {
    const response = await this.api.post('/execute', payload);
    return response.data;
  }

  async getExecutionResult(jobId: string): Promise<ExecutionResponse> {
    const response = await this.api.get(`/execute/result/${jobId}`);
    return response.data;
  }

  async executeSync(payload: ExecutionRequest): Promise<ExecutionResponse> {
    const response = await this.api.post('/execute/sync', payload);
    return response.data;
  }

  async startInteractiveJavaSession(payload: ExecutionRequest): Promise<InteractiveSessionResponse> {
    const response = await this.api.post('/execute/java/interactive', payload);
    return response.data;
  }

  async getInteractiveJavaSession(sessionId: string): Promise<InteractiveSessionResponse> {
    const response = await this.api.get(`/execute/java/interactive/${sessionId}`);
    return response.data;
  }

  async stopInteractiveJavaSession(sessionId: string): Promise<InteractiveSessionResponse> {
    const response = await this.api.delete(`/execute/java/interactive/${sessionId}`);
    return response.data;
  }

  async analyzeComplexity(code: string, language: string) {
    const response = await this.api.post('/complexity', {
      code,
      language,
    });
    return response.data;
  }

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
    const response = await this.api.post(
      '/export-file',
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

  async listProjects(): Promise<SavedProject[]> {
    const response = await this.api.get('/projects');
    return response.data;
  }

  async saveProject(payload: SaveProjectRequest): Promise<SavedProject> {
    const response = await this.api.post('/projects/save', payload);
    return response.data;
  }

  async updateProject(projectId: number, payload: SaveProjectRequest): Promise<SavedProject> {
    const response = await this.api.put(`/projects/${projectId}`, payload);
    return response.data;
  }

  async shareProject(projectId: number): Promise<SavedProject> {
    const response = await this.api.post(`/projects/${projectId}/share`);
    return response.data;
  }

  async getSharedProject(shareId: string): Promise<SavedProject> {
    const response = await this.api.get(`/projects/shared/${shareId}`);
    return response.data;
  }

  async getRoot() {
    const response = await this.api.get('/');
    return response.data;
  }
}

export const apiService = new ApiService();
