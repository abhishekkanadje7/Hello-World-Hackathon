const API_BASE = '/api';

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

export async function fetchTickets(status = null) {
  const params = new URLSearchParams();
  if (status) params.append('status_filter', status);
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

export async function sendTicketReply(ticketId, message, is_internal = false) {
  return request(`/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message, is_internal })
  });
}

export async function updateTicketStatus(id, status, assigned_agent_id = null, assigned_agent_name = null, note = null) {
  return request(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      assigned_agent_id,
      assigned_agent_name,
      resolution_note: note
    })
  });
}

export async function fetchStats() {
  return request('/stats');
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

export function initWebSocket(onMessage, onOpen, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const ws = new WebSocket(wsUrl);
  
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
  
  return ws;
}
