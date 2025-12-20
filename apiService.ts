
// Fix: Removed Vendor import as it is not exported from types.ts
import { Project, PaymentRequest, PaymentStatus } from './types';

const API_BASE = '/api';

class APIService {
  private isConnected = false;

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async getFullState() {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/sync`);
      if (!res.ok) throw new Error('Gateway Offline');
      this.isConnected = true;
      return await res.json();
    } catch (err) {
      this.isConnected = false;
      return { _isFallback: true };
    }
  }

  async createProject(project: Project): Promise<void> {
    if (!this.isConnected) return;
    await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  // Fix: Removed unused createVendor method which relied on the missing Vendor type and missing backend endpoint

  async createRequest(payment: PaymentRequest): Promise<void> {
    if (!this.isConnected) return;
    await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
  }

  async updateRequestStatus(id: string, status: PaymentStatus, extra: any = {}): Promise<void> {
    if (!this.isConnected) return;
    await fetch(`${API_BASE}/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra })
    });
  }

  async deleteRequest(id: string): Promise<void> {
    if (!this.isConnected) return;
    await fetch(`${API_BASE}/requests/${id}`, {
      method: 'DELETE'
    });
  }

  getCloudStatus() {
    return this.isConnected;
  }
}

export const api = new APIService();
