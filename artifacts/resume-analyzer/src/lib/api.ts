import { auth } from "@/firebase";

const BASE = "/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const fbUser = auth.currentUser;
  if (fbUser) {
    try {
      const token = await fbUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {}
  }
  return {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { status: res.status });
  }
  return res.json();
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...authHeaders },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { status: res.status });
  }
  return res.json();
}

export const api = {
  auth: {
    me: () => request<any>("/auth/me"),
  },
  users: {
    me: () => request<any>("/users/me"),
    updateMe: (data: Partial<Record<string, unknown>>) =>
      request<any>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
    createUpgradeRequest: (n8nSent: boolean) =>
      request<any>("/users/upgrade-request", { method: "POST", body: JSON.stringify({ n8nSent }) }),
  },
  analyses: {
    list: (limit?: number) =>
      request<any[]>(`/analyses${limit ? `?limit=${limit}` : ""}`),
    get: (id: string) => request<any>(`/analyses/${id}`),
    create: (data: { analysisType: string; fileName: string; results: Record<string, unknown>; score: number }) =>
      request<any>("/analyses", { method: "POST", body: JSON.stringify(data) }),
  },
  admin: {
    stats: () => request<any>("/admin/stats"),
    users: () => request<any[]>("/admin/users"),
    notifyUser: (uid: string, title: string, message: string, type?: string) =>
      request<any>(`/admin/notify/${uid}`, { method: "POST", body: JSON.stringify({ title, message, type }) }),
    suspendUser: (uid: string) =>
      request<any>(`/admin/users/${uid}/suspend`, { method: "PATCH" }),
    unsuspendUser: (uid: string) =>
      request<any>(`/admin/users/${uid}/unsuspend`, { method: "PATCH" }),
    deleteUser: (uid: string) =>
      request<any>(`/admin/users/${uid}`, { method: "DELETE" }),
    addScans: (uid: string, amount: number) =>
      request<any>(`/admin/users/${uid}/scans`, { method: "PATCH", body: JSON.stringify({ amount }) }),
    changeRole: (uid: string, role: string) =>
      request<any>(`/admin/users/${uid}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    changePlan: (uid: string, plan: string) =>
      request<any>(`/admin/users/${uid}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) }),
    upgradeRequests: () => request<any[]>("/admin/upgrade-requests"),
    approveUpgrade: (requestId: string) =>
      request<any>(`/admin/upgrade-requests/${requestId}/approve`, { method: "PATCH" }),
    rejectUpgrade: (requestId: string) =>
      request<any>(`/admin/upgrade-requests/${requestId}/reject`, { method: "PATCH" }),
    setup: () => request<any>("/admin/setup"),
  },
  settings: {
    get: () => request<any>("/settings"),
    update: (patch: Record<string, unknown>) =>
      request<any>("/settings", { method: "PATCH", body: JSON.stringify(patch) }),
  },
  pricing: {
    get: () => fetch("/api/pricing-config").then(r => r.json()),
    update: (patch: Record<string, unknown>) =>
      request<any>("/pricing-config", { method: "PATCH", body: JSON.stringify(patch) }),
  },
  notifications: {
    list: () => request<any[]>("/notifications"),
    unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request<any>("/notifications/read-all", { method: "PATCH" }),
  },
  n8nProxy: (webhookUrl: string, body: Record<string, unknown>) =>
    request<any>("/n8n-proxy", { method: "POST", body: JSON.stringify({ webhook_url: webhookUrl, ...body }) }),
  n8nProxyForm: async (webhookUrl: string, formData: FormData) => {
    const payload: Record<string, unknown> = { webhook_url: webhookUrl };
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = await value.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        payload[`${key}__base64`] = btoa(binary);
        payload[`${key}__name`] = value.name;
        payload[`${key}__type`] = value.type || "application/octet-stream";
      } else {
        payload[key] = value;
      }
    }
    return request<any>("/n8n-proxy", { method: "POST", body: JSON.stringify(payload) });
  },
};
