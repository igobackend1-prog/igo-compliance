
import { Project, Vendor, PaymentRequest, AuditLog, PaymentStatus, Role } from './types';

// In a real production app, this would be your Cloud Run URL
const API_BASE_URL = '/api'; 

/**
 * Service to handle all communication with the centralized Firestore backend.
 * Implementation uses a fallback to localStorage for immediate preview capability,
 * but is structured for production fetch calls.
 */
class APIService {
  private isMock = true; // Set to false when backend is deployed

  private async request(endpoint: string, options: any = {}) {
    if (this.isMock) return this.mockRequest(endpoint, options);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('igo_token')}`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return this.request('/projects');
  }

  async createProject(project: Project): Promise<Project> {
    return this.request('/projects', { method: 'POST', body: JSON.stringify(project) });
  }

  // --- Vendors ---
  async getVendors(): Promise<Vendor[]> {
    return this.request('/vendors');
  }

  async createVendor(vendor: Vendor): Promise<Vendor> {
    return this.request('/vendors', { method: 'POST', body: JSON.stringify(vendor) });
  }

  // --- Payments ---
  async getRequests(): Promise<PaymentRequest[]> {
    return this.request('/payments');
  }

  async createRequest(payment: PaymentRequest): Promise<PaymentRequest> {
    return this.request('/payments', { method: 'POST', body: JSON.stringify(payment) });
  }

  async updateRequestStatus(id: string, status: PaymentStatus, extra: any = {}): Promise<void> {
    return this.request(`/payments/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status, ...extra }) 
    });
  }

  // --- Audit ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/audit');
  }

  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    return this.request('/audit', { method: 'POST', body: JSON.stringify(log) });
  }

  // --- Mock Implementation (For Preview) ---
  private async mockRequest(endpoint: string, options: any) {
    const get = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
    const set = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

    await new Promise(r => setTimeout(r, 100)); // Simulate latency

    if (endpoint === '/projects') {
      if (options.method === 'POST') {
        const data = get('igo_projects');
        const newItem = JSON.parse(options.body);
        data.push(newItem);
        set('igo_projects', data);
        return newItem;
      }
      return get('igo_projects');
    }

    if (endpoint === '/vendors') {
      if (options.method === 'POST') {
        const data = get('igo_vendors');
        const newItem = JSON.parse(options.body);
        data.push(newItem);
        set('igo_vendors', data);
        return newItem;
      }
      return get('igo_vendors');
    }

    if (endpoint === '/payments') {
      if (options.method === 'POST') {
        const data = get('igo_requests');
        const newItem = JSON.parse(options.body);
        data.unshift(newItem);
        set('igo_requests', data);
        return newItem;
      }
      return get('igo_requests');
    }

    if (endpoint.startsWith('/payments/') && options.method === 'PATCH') {
      const id = endpoint.split('/').pop();
      const patch = JSON.parse(options.body);
      const data = get('igo_requests').map((r: any) => r.id === id ? { ...r, ...patch } : r);
      set('igo_requests', data);
      return { success: true };
    }

    if (endpoint === '/audit') {
      if (options.method === 'POST') {
        const data = get('igo_logs');
        const newItem = JSON.parse(options.body);
        data.unshift(newItem);
        set('igo_logs', data);
        return newItem;
      }
      return get('igo_logs');
    }
    
    return [];
  }
}

export const api = new APIService();
