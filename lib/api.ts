const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health', {
      method: 'GET',
    });
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    company: string;
    role: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Admin Analytics endpoints
  async getAdminAnalytics(): Promise<ApiResponse> {
    return this.request('/users/stats/overview');
  }

  async getSystemHealth(): Promise<ApiResponse> {
    return this.request('/system-health/current');
  }

  async getSystemHealthStats(): Promise<ApiResponse> {
    return this.request('/system-health/stats/overview');
  }

  async getSystemHealthMetrics(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const query = queryParams.toString();
    return this.request(`/system-health/metrics${query ? `?${query}` : ''}`);
  }

  async getSystemServices(): Promise<ApiResponse> {
    return this.request('/system-health/services');
  }

  // Admin Settings endpoints
  async getSystemSettings(): Promise<ApiResponse> {
    return this.request('/admin/settings');
  }

  async updateSystemSettings(settings: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    maintenanceMode?: boolean;
    autoBackup?: boolean;
    dataRetention?: string;
    timezone?: string;
    currency?: string;
    language?: string;
    apiRateLimit?: number;
    sessionDuration?: number;
    maxFileUploadSize?: string;
    databaseConnectionPool?: number;
  }): Promise<ApiResponse> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // User Management endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    company?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.company) queryParams.append('company', params.company);

    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    company: string;
    role: string;
    status?: string;
    department?: string;
    designation?: string;
  }): Promise<ApiResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    status?: string;
    department?: string;
    designation?: string;
  }): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserById(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`);
  }

  // API Key Management endpoints
  async getAPIKeys(): Promise<ApiResponse> {
    return this.request('/admin/api-keys');
  }

  async createAPIKey(apiKeyData: {
    name: string;
    description?: string;
    permissions?: string[];
  }): Promise<ApiResponse> {
    return this.request('/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify(apiKeyData),
    });
  }

  async deleteAPIKey(keyId: string): Promise<ApiResponse> {
    return this.request(`/admin/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // ERP Integration endpoints
  async getIntegrations(): Promise<ApiResponse> {
    return this.request('/integrations');
  }

  async createIntegration(integrationData: {
    name: string;
    type: string;
    endpoint: string;
    apiKey?: string;
    username?: string;
    password?: string;
    description?: string;
    settings?: any;
  }): Promise<ApiResponse> {
    return this.request('/integrations', {
      method: 'POST',
      body: JSON.stringify(integrationData),
    });
  }

  async updateIntegration(integrationId: string, integrationData: any): Promise<ApiResponse> {
    return this.request(`/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(integrationData),
    });
  }

  async deleteIntegration(integrationId: string): Promise<ApiResponse> {
    return this.request(`/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  }

  async testIntegration(integrationId: string): Promise<ApiResponse> {
    return this.request(`/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  }

  async syncIntegration(integrationId: string): Promise<ApiResponse> {
    return this.request(`/integrations/${integrationId}/sync`, {
      method: 'POST',
    });
  }

  // Document Processing endpoints
  async uploadDocument(formData: FormData): Promise<ApiResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const uploadUrl = `${this.baseURL}/documents/upload`;
    
    console.log('🔄 Starting document upload:', {
      url: uploadUrl,
      hasToken: !!token,
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'object' ? 'File' : value])
    });
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      console.log('📡 Upload response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const data = await response.json();
      console.log('📄 Upload response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Document upload failed:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  async getDocuments(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/documents${query ? `?${query}` : ''}`);
  }

  async getDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}`);
  }

  async updateDocument(documentId: string, updateData: any): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async reprocessDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}/reprocess`, {
      method: 'POST',
    });
  }

  async downloadDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}/download`);
  }

  // Validation endpoints
  async validateInvoice(documentId: string): Promise<ApiResponse> {
    return this.request('/validation/invoice', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  }

  async validateBOE(invoiceDocumentId: string, boeDocumentId: string): Promise<ApiResponse> {
    return this.request('/validation/boe', {
      method: 'POST',
      body: JSON.stringify({ invoiceDocumentId, boeDocumentId }),
    });
  }

  async getValidations(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/validation${query ? `?${query}` : ''}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Demo credentials that match the backend
export const DEMO_CREDENTIALS = {
  admin: { email: "admin@example.com", password: "admin123", role: "admin" },
  exporter: { email: "exporter@example.com", password: "exporter123", role: "exporter" },
  ca: { email: "ca@example.com", password: "ca123", role: "ca" },
  forwarder: { email: "forwarder@example.com", password: "forwarder123", role: "forwarder" },
};

// Auth utilities
export const authUtils = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
}; 