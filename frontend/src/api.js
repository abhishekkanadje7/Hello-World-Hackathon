const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDemoUsers() {
  const res = await fetch(`${API_BASE}/auth/demo-users`);
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchTickets(status = null, tier = null) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (tier) params.append('tier', tier);
  const res = await fetch(`${API_BASE}/tickets?${params.toString()}`);
  return res.json();
}

export async function fetchTicketById(id) {
  const res = await fetch(`${API_BASE}/tickets/${id}`);
  return res.json();
}

export async function previewTicketScore(payload) {
  const res = await fetch(`${API_BASE}/tickets/preview-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function createTicket(ticketData) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit ticket');
  }
  return res.json();
}

export async function updateTicketStatus(id, updateData) {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchWeights() {
  const res = await fetch(`${API_BASE}/admin/weights`);
  return res.json();
}

export async function updateWeights(weightsData) {
  const res = await fetch(`${API_BASE}/admin/weights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weightsData)
  });
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/admin/audit-logs`);
  return res.json();
}

export async function fetchKbArticles() {
  const res = await fetch(`${API_BASE}/kb/articles`);
  return res.json();
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
