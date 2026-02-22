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
  owner?: { phone: string };
  branches?: Branch[];
}

export interface Branch {
  id: string;
  branchName: string;
  partnerId: string;
  settings?: { streakThreshold?: number; cooldownHours?: number; cooldownMinutes?: number; rewardWindowDays?: number; rewardDescription?: string; minCheckInAmount?: number };
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
  name?: string | null;
}

export interface StoreVisit {
  branchId: string;
  branchName: string;
  partnerId: string;
  partnerName: string;
  visitCount: number;
  lastVisitAt: string;
  rewardThreshold?: number;
  rewardWindowDays?: number;
  rewardDescription?: string;
  streakCurrentCount?: number;
  streakPeriodStartedAt?: string | null;
}

export interface CustomerProfile {
  customer: Customer & {
    streaks?: { currentCount: number; partnerId: string; partner?: Partner; periodStartedAt?: string | null }[];
    rewards?: Reward[];
  };
  storesVisited: StoreVisit[];
}

export interface Activity {
  id: string;
  customerId: string;
  branchId: string;
  staffId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  value?: number;
  customerName?: string | null;
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
  redeemedAt?: string;
  redeemedBranchId?: string;
  redemptionCode?: string | null;
  redemptionCompletedAt?: string | null;
  customer?: Customer;
  partner?: Partner;
  redeemedBranch?: Branch;
}

export interface HistoryActivity {
  id: string;
  customerId: string;
  branchId: string;
  staffId: string | null;
  status: string;
  value: number | null;
  customerName?: string | null;
  createdAt: string;
  branch: Branch;
  partner: Partner;
}

export interface HistoryRedeemedReward {
  id: string;
  customerId: string;
  partnerId: string;
  status: string;
  expiryDate: string | null;
  createdAt: string;
  redeemedAt: string | null;
  redeemedBranchId: string | null;
  partner: Partner;
  redeemedBranch: Branch | null;
}

export interface CustomerHistory {
  activities: HistoryActivity[];
  redeemedRewards: HistoryRedeemedReward[];
}

const CUSTOMER_TOKEN_KEY = 'customer_token';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearCustomerToken(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function getCustomerTokenIfPresent(): string | null {
  return getCustomerToken();
}

/** Decode customer JWT payload to get phone so socket can connect without waiting for getMyProfile(). */
export function getCustomerPhoneFromToken(): string | null {
  const token = getCustomerToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = payloadBase64.length % 4;
    const padded = padding ? payloadBase64 + '='.repeat(4 - padding) : payloadBase64;
    const payload = JSON.parse(atob(padded)) as { phone?: string; type?: string };
    if (payload.type === 'customer' && payload.phone != null) {
      const p = payload.phone;
      return typeof p === 'string' ? p.trim() : String(p).trim();
    }
    return null;
  } catch {
    return null;
  }
}

function getAuthHeader(): string | null {
  const t = getToken();
  return t ? `Bearer ${t}` : null;
}

function getCustomerAuthHeader(): string | null {
  const t = getCustomerToken();
  return t ? `Bearer ${t}` : null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  useCustomerToken = false
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const auth = useCustomerToken ? getCustomerAuthHeader() : getAuthHeader();
  if (auth) headers['Authorization'] = auth;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    if (useCustomerToken && (res.status === 401 || res.status === 404)) {
      clearCustomerToken();
      window.location.replace('/');
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface CustomerLoginResponse {
  access_token: string;
  customer: { phone: string };
}

export const authApi = {
  sendOtp: (phone: string, code?: string) =>
    api<{ success: true; otp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, ...(code != null && { code }) }),
    }),
  login: (phone: string, otp: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
  customerLogin: (phone: string, otp: string) =>
    api<CustomerLoginResponse>('/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
};

export const partnersApi = {
  list: () => api<Partner[]>('/partners'),
  get: (id: string) => api<Partner & { branches?: Branch[] }>(`/partners/${id}`),
  create: (body: { businessName: string; industryType: string; ownerPhone: string }) =>
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
    settings?: { streakThreshold?: number; cooldownHours?: number; cooldownMinutes?: number; rewardWindowDays?: number; rewardDescription?: string; minCheckInAmount?: number };
    location?: { lat: number; lng: number };
  }) => api<Branch>('/branches', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: {
      branchName?: string;
      settings?: { streakThreshold?: number; cooldownHours?: number; cooldownMinutes?: number; rewardWindowDays?: number; rewardDescription?: string; minCheckInAmount?: number };
      location?: { lat: number; lng: number };
    }
  ) => api<Branch>(`/branches/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<Branch>(`/branches/${id}`, { method: 'DELETE' }),
};

export const staffApi = {
  list: () => api<Staff[]>('/staff'),
  get: (id: string) => api<Staff & { branch?: Branch }>(`/staff/${id}`),
  create: (body: { name: string; phone: string; branchId: string }) =>
    api<Staff>('/staff', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; phone?: string }) =>
    api<Staff>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<Staff>(`/staff/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  list: () => api<Customer[]>('/customers'),
  get: (phoneNumber: string) =>
    api<Customer & { streaks?: unknown[]; rewards?: Reward[] }>(`/customers/${encodeURIComponent(phoneNumber)}`),
  getByPhone: (phoneNumber: string) =>
    api<Customer & { streaks?: unknown[]; rewards?: Reward[] }>(`/customers/phone/${encodeURIComponent(phoneNumber)}`),
  getProfile: (phoneNumber: string) =>
    api<CustomerProfile>(`/customers/phone/${encodeURIComponent(phoneNumber)}/profile`),
  getMyProfile: () =>
    api<CustomerProfile>('/customers/me/profile', {}, true),
  getMyHistory: () =>
    api<CustomerHistory>('/customers/me/history', {}, true),
  create: (body: { phoneNumber: string }) =>
    api<Customer>('/customers', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: { branchId: string; phoneNumber: string; name: string; otp: string }) =>
    api<CustomerLoginResponse>('/customers/register', { method: 'POST', body: JSON.stringify(body) }),
};

export const activityApi = {
  list: () => api<Activity[]>('/activity'),
  get: (id: string) => api<Activity>(`/activity/${id}`),
  checkIn: (body: {
    branchId: string;
    phoneNumber: string;
    customerName?: string;
    value?: number;
    requestLocation?: { lat: number; lng: number };
  }) =>
    api<Activity>('/activity/check-in', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED', value?: number) =>
    api<Activity>(`/activity/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(value != null ? { status, value } : { status }),
    }),
};

export const rewardsApi = {
  list: () => api<Reward[]>('/rewards'),
  get: (id: string) => api<Reward>(`/rewards/${id}`),
  byCustomer: (customerId: string) =>
    api<Reward[]>(`/rewards/customer/${encodeURIComponent(customerId)}`),
  redeem: (id: string) =>
    api<Reward>(`/rewards/${id}/redeem`, { method: 'PATCH' }, true),
  pendingRedemptions: () =>
    api<Reward[]>('/rewards/pending-redemptions'),
  completeByCode: (code: string) =>
    api<Reward>('/rewards/complete-by-code', {
      method: 'POST',
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    }),
};

export interface Feedback {
  id: string;
  customerId: string;
  message: string;
  createdAt: string;
}

export const feedbackApi = {
  submit: (message: string) =>
    api<Feedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ message: message.trim() }),
    }, true),
  list: () => api<(Feedback & { customer?: { phoneNumber: string; name: string | null } })[]>('/feedback'),
};
