import { apiFetch, API_BASE } from "@/lib/api";

export type UrlLink = {
  id: number;
  short_code: string;
  destination_url: string;
  title?: string | null;
  note?: string | null;
  status: "active" | "paused" | "expired" | "blocked";
  redirect_type: "301" | "302";
  expires_at?: string | null;
  is_flagged: number | boolean;
  flag_reason?: string | null;
  approval_request_status?: "none" | "requested" | "approved" | "denied";
  created_at: string;
  updated_at?: string;
  custom_domain?: string | null;
  total_clicks?: number;
  unique_visitors?: number;
  last_click_at?: string | null;
};

export const buildShortUrl = (code: string, customDomain?: string | null) => {
  if (customDomain) {
    return `http://${customDomain}/redirect.php?c=${code}`;
  }
  return `${API_BASE}/redirect.php?c=${code}`;
};

export async function urlmdGetLinks(params?: { status?: string; q?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query}` : "";
  const res = await apiFetch(`/urlmd_get_links.php${suffix}`);
  return res.json();
}

export async function urlmdCreateLink(payload: {
  destination_url: string;
  short_code?: string;
  title?: string;
  note?: string;
  redirect_type?: "301" | "302";
  expires_at?: string;
  custom_domain_id?: number | null;
}) {
  const res = await apiFetch("/urlmd_create_link.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function urlmdUpdateLink(payload: {
  id: number;
  destination_url?: string;
  title?: string;
  note?: string;
  status?: "active" | "paused" | "expired" | "blocked";
  redirect_type?: "301" | "302";
  expires_at?: string;
}) {
  const res = await apiFetch("/urlmd_update_link.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function urlmdDeleteLink(id: number) {
  const res = await apiFetch("/urlmd_delete_link.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function urlmdGetAnalytics(id: number) {
  const res = await apiFetch(`/urlmd_get_link_analytics.php?id=${id}`);
  return res.json();
}
