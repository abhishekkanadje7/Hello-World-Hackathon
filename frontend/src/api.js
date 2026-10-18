import { handleMockRequest } from './mockEngine';

const API_BASE = '/api';

export const isStaticHosting = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
);

let onSessionExpiredCallback = null;

export function setOnSessionExpired(callback) {
  onSessionExpiredCallback = callback;
}

export function getToken() {
  return localStorage.getItem('triagex_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('triagex_token', token);
  } else {
    localStorage.removeItem('triagex_token');
  }
}

async function request(endpoint, options = {}) {
  // If hosted on GitHub Pages (static file host without python runtime), use Mock Engine directly
  if (isStaticHosting) {
    return await handleMockRequest(endpoint, options);
  }

  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 404 || res.status === 502 || res.status === 503) {
      // Backend route unreachable, fallback to Mock Engine
      return await handleMockRequest(endpoint, options);
    }

    if (res.status === 401) {
      // Check if it was an expired token on a protected endpoint
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        setToken(null);
        localStorage.removeItem('triagex_user');
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback('Your session expired, please log in again.');
        }
      }
    }

    if (!res.ok) {
      let errMessage = 'Request failed';
      try {
        const err = await res.json();
        errMessage = err.detail || errMessage;
      } catch (e) {
        errMessage = res.statusText || errMessage;
      }
      const error = new Error(errMessage);
      error.status = res.status;
      throw error;
    }

    return res.json();
  } catch (err) {
    if (err.name === 'TypeError' || (err.message && err.message.includes('Failed to fetch'))) {
      console.warn('Backend server offline, switching to Client Mock Engine');
      return await handleMockRequest(endpoint, options);
    }
    throw err;
  }
}


// --- AUTH APIS ---

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerCustomer(name, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export async function getMe() {
  return request('/auth/me');
}

export async function changePassword(current_password, new_password) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password })
  });
}

export async function fetchDemoUsers() {
  return request('/auth/demo-users');
}

// --- TICKETS APIS ---

export async function fetchTickets({ status = null, tier = null, search = null, page = null, pageSize = null } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status_filter', status);
  if (tier) params.append('tier_filter', tier);
  if (search) params.append('search', search);
  if (page) params.append('page', page);
  if (pageSize) params.append('page_size', pageSize);
  return request(`/tickets?${params.toString()}`);
}

export async function fetchTicketById(id) {
  return request(`/tickets/${id}`);
}

export async function createTicket(ticketData) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
}

export async function previewTicketScore(payload) {
  return request('/tickets/preview-score', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchTicketReplies(ticketId) {
  return request(`/tickets/${ticketId}/replies`);
}

export async function sendTicketReply(ticketId, message, is_internal = false, attachments = []) {
  return request(`/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message, is_internal, attachments })
  });
}

export async function logTicketCall(ticketId, durationSeconds, callStatus = 'Completed') {
  return request(`/tickets/${ticketId}/call`, {
    method: 'POST',
    body: JSON.stringify({ duration_seconds: durationSeconds, call_status: callStatus })
  });
}

export async function updateTicketStatus(id, statusOrPayload, assigned_agent_id = null, assigned_agent_name = null, note = null) {
  let bodyPayload = {};
  if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
    bodyPayload = {
      status: statusOrPayload.status,
      assigned_agent_id: statusOrPayload.assigned_agent_id || null,
      assigned_agent_name: statusOrPayload.assigned_agent_name || statusOrPayload.assigned_agent || null,
      resolution_note: statusOrPayload.resolution_note || statusOrPayload.note || null
    };
  } else {
    bodyPayload = {
      status: statusOrPayload,
      assigned_agent_id,
      assigned_agent_name,
      resolution_note: note
    };
  }
  return request(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(bodyPayload)
  });
}

export async function fetchStats() {
  return request('/stats');
}

// --- AGENT PORTAL APIS ---

export async function fetchAgentStats() {
  return request('/agent/stats');
}

export async function claimTicket(ticketId) {
  return request(`/tickets/${ticketId}/claim`, {
    method: 'POST'
  });
}

export async function releaseTicket(ticketId) {
  return request(`/tickets/${ticketId}/release`, {
    method: 'POST'
  });
}

// --- ADMIN PORTAL APIS ---

export async function fetchAdminAnalytics() {
  return request('/admin/analytics');
}

export async function fetchAdminUsers() {
  return request('/admin/users');
}

export async function createAdminAgent(agentData) {
  return request('/admin/agents', {
    method: 'POST',
    body: JSON.stringify(agentData)
  });
}

export async function updateAdminUser(userId, updates) {
  return request(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function resetAdminUserPassword(userId) {
  return request(`/admin/users/${userId}/reset-password`, {
    method: 'POST'
  });
}

export async function fetchAdminFaqs() {
  return request('/admin/faqs');
}

export async function createAdminFaq(faqData) {
  return request('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(faqData)
  });
}

export async function updateAdminFaq(faqId, faqData) {
  return request(`/admin/faqs/${faqId}`, {
    method: 'PATCH',
    body: JSON.stringify(faqData)
  });
}

export async function deleteAdminFaq(faqId) {
  return request(`/admin/faqs/${faqId}`, {
    method: 'DELETE'
  });
}

export async function testAdminFaqMatcher(query) {
  return request('/admin/faqs/test', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
}

export async function fetchSystemSettings() {
  return request('/admin/settings');
}

export async function saveSystemSettings(settingsData) {
  return request('/admin/settings', {
    method: 'POST',
    body: JSON.stringify(settingsData)
  });
}

export async function testGeminiConnection(apiKey) {
  return request('/admin/test-gemini', {
    method: 'POST',
    body: JSON.stringify({ gemini_api_key: apiKey })
  });
}

export async function resetDemoDatabase() {
  return request('/admin/reset-demo-data', {
    method: 'POST'
  });
}

export async function exportTicketsCsv() {
  if (isStaticHosting) {
    const list = await handleMockRequest('/tickets');
    const header = ['Ticket Number', 'Subject', 'Customer', 'Tier', 'Priority Score', 'Status', 'SLA Due'].join(',');
    const rows = (Array.isArray(list) ? list : (list.items || [])).map(t => 
      [t.ticket_number, `"${(t.subject || '').replace(/"/g, '""')}"`, `"${t.customer_name}"`, t.assigned_tier, t.priority_score, t.status, t.sla_due_at].join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }

  const token = getToken();
  const res = await fetch(`${API_BASE}/admin/tickets/export-csv`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to export CSV');
  return res.blob();
}

export async function fetchWeights() {
  return request('/admin/weights');
}

export async function updateWeights(weightsData) {
  return request('/admin/weights', {
    method: 'POST',
    body: JSON.stringify(weightsData)
  });
}

export async function fetchAuditLogs() {
  return request('/admin/audit-logs');
}

export async function fetchKbArticles() {
  return request('/kb/articles');
}

// --- PROMPT C3: NOTIFICATIONS, CSAT, CANNED REPLIES & PROFILE ---

export async function fetchNotifications() {
  return request('/notifications');
}

export async function markNotificationsAsRead() {
  return request('/notifications/read', {
    method: 'POST'
  });
}

export async function fetchCannedReplies() {
  return request('/canned-replies');
}

export async function createCannedReply(cannedData) {
  return request('/canned-replies', {
    method: 'POST',
    body: JSON.stringify(cannedData)
  });
}

export async function deleteCannedReply(cannedId) {
  return request(`/canned-replies/${cannedId}`, {
    method: 'DELETE'
  });
}

export async function submitCsatRating(ticketId, rating, feedback = '') {
  return request(`/tickets/${ticketId}/csat`, {
    method: 'POST',
    body: JSON.stringify({ rating, feedback })
  });
}

export async function updateUserProfile(name) {
  return request('/user/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
}

export function initWebSocket(onMessage, onOpen, onClose) {
  if (isStaticHosting) {
    // Provide simulated live websocket pulse for GitHub Pages
    setTimeout(() => {
      if (onOpen) onOpen();
    }, 250);

    const interval = setInterval(() => {
      if (onMessage) {
        onMessage({ type: 'HEARTBEAT', timestamp: new Date().toISOString() });
      }
    }, 15000);

    return {
      close: () => {
        clearInterval(interval);
        if (onClose) onClose();
      },
      send: () => {}
    };
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  let ws;
  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      if (onOpen) onOpen();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };
    ws.onclose = () => {
      if (onClose) onClose();
    };
  } catch (err) {
    console.warn('WebSocket connection failed, switching to poll mode');
    if (onOpen) onOpen();
    ws = {
      close: () => {},
      send: () => {}
    };
  }
  
  return ws;
}
