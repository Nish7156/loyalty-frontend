const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type PlatformRole = 'SUPER_ADMIN' | 'PARTNER_OWNER';

export interface PlatformUser {
  id: string;
  phone: string;
  role: PlatformRole;
}

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  branchId: string;
}

export interface LoginResponse {
  access_token: string;
  user?: PlatformUser;
  staff?: StaffUser;
}

export interface Partner {
  id: string;
  businessName: string;
  industryType: string;
  ownerId: string;
  branches?: Branch[];
}

export interface Branch {
  id: string;
  branchName: string;
  partnerId: string;
  settings?: { streakThreshold?: number; cooldownHours?: number };
  location?: { lat: number; lng: number };
  partner?: Partner;
  staff?: Staff[];
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  branch?: Branch;
}

export interface Customer {
  phoneNumber: string;
}

export interface Activity {
  id: string;
  customerId: string;
  branchId: string;
  staffId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  value?: number;
  requestLocation?: { lat: number; lng: number };
  createdAt: string;
  customer?: Customer & { streaks?: unknown[] };
  branch?: Branch;
  staff?: Staff | null;
  locationFlagDistant?: boolean;
}

export interface Reward {
  id: string;
  customerId: string;
  partnerId: string;
  status: 'ACTIVE' | 'REDEEMED';
  expiryDate?: string;
  createdAt: string;
  customer?: Customer;
  partner?: Partner;
}

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function getAuthHeader(): string | null {
  const t = getToken();
  return t ? `Bearer ${t}` : null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const auth = getAuthHeader();
  if (auth) headers['Authorization'] = auth;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  sendOtp: (phone: string) =>
    api<{ success: true; otp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  login: (phone: string, otp: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
};

export const partnersApi = {
  list: () => api<Partner[]>('/partners'),
  get: (id: string) => api<Partner & { branches?: Branch[] }>(`/partners/${id}`),
  create: (body: { businessName: string; industryType: string; ownerId?: string }) =>
    api<Partner>('/partners', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { businessName?: string; industryType?: string }) =>
    api<Partner>(`/partners/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<Partner>(`/partners/${id}`, { method: 'DELETE' }),
};

export const branchesApi = {
  list: () => api<Branch[]>('/branches'),
  get: (id: string) => api<Branch & { partner?: Partner; staff?: Staff[] }>(`/branches/${id}`),
  create: (body: {
    branchName: string;
    partnerId: string;
    settings?: { streakThreshold?: number; cooldownHours?: number };
    location?: { lat: number; lng: number };
  }) => api<Branch>('/branches', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: {
      branchName?: string;
      settings?: { streakThreshold?: number; cooldownHours?: number };
      location?: { lat: number; lng: number };
    }
  ) => api<Branch>(`/branches/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<Branch>(`/branches/${id}`, { method: 'DELETE' }),
};

export const staffApi = {
  list: () => api<Staff[]>('/staff'),
  get: (id: string) => api<Staff & { branch?: Branch }>(`/staff/${id}`),
  create: (body: { name: string; phone: string; password: string; branchId: string }) =>
    api<Staff>('/staff', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; phone?: string; password?: string }) =>
    api<Staff>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<Staff>(`/staff/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  list: () => api<Customer[]>('/customers'),
  get: (phoneNumber: string) =>
    api<Customer & { streaks?: unknown[]; rewards?: Reward[] }>(`/customers/${encodeURIComponent(phoneNumber)}`),
  getByPhone: (phoneNumber: string) =>
    api<Customer & { streaks?: unknown[]; rewards?: Reward[] }>(`/customers/phone/${encodeURIComponent(phoneNumber)}`),
  create: (body: { phoneNumber: string }) =>
    api<Customer>('/customers', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: { branchId: string; phoneNumber: string; otp: string }) =>
    api<Customer>('/customers/register', { method: 'POST', body: JSON.stringify(body) }),
};

export const activityApi = {
  list: () => api<Activity[]>('/activity'),
  get: (id: string) => api<Activity>(`/activity/${id}`),
  checkIn: (body: {
    branchId: string;
    phoneNumber: string;
    value?: number;
    requestLocation?: { lat: number; lng: number };
  }) =>
    api<Activity>('/activity/check-in', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    api<Activity>(`/activity/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const rewardsApi = {
  list: () => api<Reward[]>('/rewards'),
  get: (id: string) => api<Reward>(`/rewards/${id}`),
  byCustomer: (customerId: string) =>
    api<Reward[]>(`/rewards/customer/${encodeURIComponent(customerId)}`),
  redeem: (id: string) =>
    api<Reward>(`/rewards/${id}/redeem`, { method: 'PATCH' }),
};
