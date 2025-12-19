
import { Project, Vendor, PaymentRequest, AuditLog, PaymentStatus } from './types';

/**
 * IGO COMPLIANCE - HYBRID CLOUD CLIENT
 * Manages the transition between Cloud Mirroring and Terminal Local Storage.
 */

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
      // Return a special flag indicating we should use local storage
      return { _isFallback: true };
    }
  }

  async createProject(project: Project): Promise<void> {
    if (!this.isConnected) return; // In local mode, we let the UI handle the state
    await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  async createVendor(vendor: Vendor): Promise<void> {
    if (!this.isConnected) return;
    await fetch(`${API_BASE}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor)
    });
  }

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

  getCloudStatus() {
    return this.isConnected;
  }
}

export const api = new APIService();
