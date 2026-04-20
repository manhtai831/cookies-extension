export interface CookieData {
  name: string;
  value: string;
  expiry: number;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface CookieGroup {
  id?: string; // uuid
  name: string; // group name from formData
  url: string; // current tab domain when saved
  cookies: CookieData[];
  synced: boolean;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt?: number;
}

export interface ApiKey {
  host: string;
  key: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
