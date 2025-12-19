
import { Project, Vendor, PaymentRequest, AuditLog, PaymentStatus } from './types';

/**
 * IGO COMPLIANCE - CENTRALIZED API SERVICE
 * Targets the server.js Express backend.
 */

const API_BASE_URL = '/api';

class APIService {
  private isServerAvailable = false;

  private async request(endpoint: string, options: any = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        // If we get a 404, the server is there but the route is wrong, 
        // but often in dev, a 404 on /api means the proxy/backend isn't running.
        if (response.status === 404) {
          throw new Error('SERVER_404');
        }
        const errorText = await response.text();
        throw new Error(`API_${response.status}: ${errorText}`);
      }
      
      this.isServerAvailable = true;
      return response.json();
    } catch (error: any) {
      if (error.message === 'SERVER_404' || error.name === 'TypeError') {
        this.isServerAvailable = false;
        return this.fallback(endpoint, options);
      }
      throw error;
    }
  }

  /**
   * FALLBACK MECHANISM
   * If the cloud server is unreachable, we use local storage 
   * so the user can continue working, but sync will be disabled.
   */
  private async fallback(endpoint: string, options: any) {
    const key = `igo_local_${endpoint.split('/')[1]}`;
    const localData = localStorage.getItem(key);
    const data = localData ? JSON.parse(localData) : [];

    if (options.method === 'POST') {
      const newItem = JSON.parse(options.body);
      data.unshift(newItem);
      localStorage.setItem(key, JSON.stringify(data));
      return newItem;
    }

    if (options.method === 'PATCH') {
      const id = endpoint.split('/').pop();
      const update = JSON.parse(options.body);
      const updatedData = data.map((item: any) => 
        item.id === id ? { ...item, ...update } : item
      );
      localStorage.setItem(key, JSON.stringify(updatedData));
      return { success: true };
    }

    return data;
  }

  public getStatus() {
    return this.isServerAvailable;
  }

  async getProjects(): Promise<Project[]> {
    return this.request('/projects');
  }

  async createProject(project: Project): Promise<Project> {
    return this.request('/projects', { method: 'POST', body: JSON.stringify(project) });
  }

  async getVendors(): Promise<Vendor[]> {
    return this.request('/vendors');
  }

  async createVendor(vendor: Vendor): Promise<Vendor> {
    return this.request('/vendors', { method: 'POST', body: JSON.stringify(vendor) });
  }

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

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/audit');
  }

  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    return this.request('/audit', { method: 'POST', body: JSON.stringify(log) });
  }
}

export const api = new APIService();
