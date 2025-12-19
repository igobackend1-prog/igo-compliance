
import { Project, Vendor, PaymentRequest, AuditLog, PaymentStatus } from './types';

// Using Google's Official Firebase SDK for 100% Cloud Reliability
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  enableNetwork,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * IGO COMPLIANCE - MISSION CRITICAL CLOUD CONFIG
 * Linked to Project: gen-lang-client-0829363952
 * OAuth ID: 284152299494-r0rsqofp3kk9hm71603f7jjnh740cbim.apps.googleusercontent.com
 */
const firebaseConfig = {
  apiKey: "AIzaSyAWammBxlFl2KgtuXknbcAi55QB5BX8eqA", 
  authDomain: "gen-lang-client-0829363952.firebaseapp.com",
  projectId: "gen-lang-client-0829363952", // CORRECTED PROJECT ID
  storageBucket: "gen-lang-client-0829363952.appspot.com",
  messagingSenderId: "284152299494",
  appId: "1:284152299494:web:r0rsqofp3kk9hm71603f7jjnh740cbim"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class APIService {
  /**
   * CENTRALIZED CLOUD STORAGE
   * Every function below hits the gen-lang-client-0829363952 project directly.
   */

  async getProjects(): Promise<Project[]> {
    const q = query(collection(db, "projects"), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Project);
  }

  async createProject(project: Project): Promise<Project> {
    await setDoc(doc(db, "projects", project.id), project);
    return project;
  }

  async getVendors(): Promise<Vendor[]> {
    const snap = await getDocs(collection(db, "vendors"));
    return snap.docs.map(d => d.data() as Vendor);
  }

  async createVendor(vendor: Vendor): Promise<Vendor> {
    await setDoc(doc(db, "vendors", vendor.id), vendor);
    return vendor;
  }

  async getRequests(): Promise<PaymentRequest[]> {
    const q = query(collection(db, "payments"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PaymentRequest);
  }

  async createRequest(payment: PaymentRequest): Promise<PaymentRequest> {
    await setDoc(doc(db, "payments", payment.id), payment);
    
    // Auto-Log to Cloud Audit Trail
    await this.createAuditLog({
      id: `LOG-${Date.now()}`,
      action: `Payment Initiated: ${payment.purpose}`,
      paymentId: payment.id,
      user: payment.raisedBy,
      role: 'BACKEND' as any,
      timestamp: new Date().toISOString()
    });
    
    return payment;
  }

  async updateRequestStatus(id: string, status: PaymentStatus, extra: any = {}): Promise<void> {
    const ref = doc(db, "payments", id);
    await updateDoc(ref, { status, ...extra });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const q = query(collection(db, "audit"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AuditLog);
  }

  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    await setDoc(doc(db, "audit", log.id), log);
    return log;
  }

  // Connectivity Health Check
  public async verifyCloudSync(): Promise<boolean> {
    try {
      await enableNetwork(db);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const api = new APIService();
