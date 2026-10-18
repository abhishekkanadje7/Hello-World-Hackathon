// Client-Side Simulation & Demo Engine for GitHub Pages & Offline Evaluator Demonstrations
// Automatically activates when running on static hosting (like GitHub Pages) or when backend API is unreachable.

const STORAGE_KEY = 'triagex_demo_db_v3';

function getInitialState() {
  const now = new Date();
  const iso = (d) => d.toISOString();

  return {
    users: [
      {
        id: 'usr-admin-01',
        name: 'Abhishek Kanadje (Admin)',
        email: 'abhishekkanadje7@gmail.com',
        password: 'Abhi*2007...',
        role: 'admin',
        agent_level: null,
        customer_type: null,
        is_active: 1,
        must_change_password: 0
      }
    ],
    tickets: [],
    replies: {},
    notifications: [],
    canned_replies: [
      {
        id: 'canned-1',
        shortcut: 'greet',
        title: 'Standard Friendly Greeting',
        category: 'General',
        content: 'Hello {{customer_name}},\n\nThank you for reaching out to TriageX Support regarding ticket {{ticket_number}}. My name is {{agent_name}}, and I will be assisting you today.'
      },
      {
        id: 'canned-2',
        shortcut: 'investigating',
        title: 'Issue Under Investigation',
        category: 'Status',
        content: 'Hi {{customer_name}},\n\nWe are actively investigating this issue with our engineering team. We are closely monitoring the system logs and will share an update shortly.'
      },
      {
        id: 'canned-3',
        shortcut: 'resolved',
        title: 'Resolution Confirmation',
        category: 'Resolution',
        content: 'Hi {{customer_name}},\n\nWe have verified that the issue reported in ticket {{ticket_number}} is now resolved. Please check on your end and let us know if everything looks good!'
      },
      {
        id: 'canned-4',
        shortcut: 'needinfo',
        title: 'Request More Information',
        category: 'Information',
        content: 'Hello {{customer_name}},\n\nCould you please provide your exact browser version and a screenshot or error code? This will help us reproduce the issue faster.'
      }
    ],
    faqs: [
      {
        id: 'faq-01',
        title: 'Password Reset & Account Recovery',
        question: 'How do I reset my account password or recover lost credentials?',
        answer: 'To reset your password, visit the login page and click "Forgot Password". Enter your registered email address to receive an instant recovery link.',
        category: 'Account',
        tags: 'password, reset, credentials, login, forgot',
        is_active: 1,
        match_count: 142
      },
      {
        id: 'faq-02',
        title: 'Billing Cycles and Invoices',
        question: 'Where can I download tax receipts and invoices?',
        answer: 'Invoices and GST receipts can be downloaded in PDF format directly from Admin Portal > Billing & Receipts section.',
        category: 'Billing',
        tags: 'invoice, billing, tax, gst, receipt, payment',
        is_active: 1,
        match_count: 98
      },
      {
        id: 'faq-03',
        title: 'Two-Factor Authentication Setup',
        question: 'How to enable 2FA / Two-Factor Authentication on my account?',
        answer: 'Navigate to Profile > Security > Enable 2FA. Scan the QR code using Google Authenticator or Authy to configure two-step verification.',
        category: 'Security',
        tags: '2fa, two factor, auth, security, authenticator',
        is_active: 1,
        match_count: 67
      }
    ],
    settings: {
      sla_critical_minutes: '15',
      sla_standard_minutes: '120',
      sla_routine_minutes: '1440',
      w_sentiment: '0.35',
      w_urgency: '0.30',
      w_churn: '0.20',
      w_tier: '0.15',
      urgency_keywords: 'urgent, outage, emergency, immediately, down, broken, asap, crash, loss'
    },
    audit_logs: [
      {
        id: 'aud-01',
        ticket_id: 't-1001',
        action: 'TICKET_CREATED',
        details: 'Critical outage ticket created by VIP customer Abhishek Kanadje',
        performed_by: 'customer@triagex.com',
        timestamp: iso(subMin(45))
      },
      {
        id: 'aud-02',
        ticket_id: 't-1001',
        action: 'TICKET_CLAIMED',
        details: 'Senior Agent Pooja Sharma claimed ticket TX-0001',
        performed_by: 'senior@triagex.com',
        timestamp: iso(subMin(42))
      }
    ]
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.active_calls) parsed.active_calls = {};
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load demo DB from localStorage', e);
  }
  const init = getInitialState();
  init.active_calls = {};
  saveDB(init);
  return init;
}

function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Failed to save demo DB to localStorage', e);
  }
}

// Calculate Cognitive Semantic AI Priority client-side (Deep Intent & Context Understanding)
export function calculateClientPriority(subject, description, customerType, customerPriority = 'Normal') {
  const text = `${subject} ${description}`.toLowerCase();
  
  // Semantic Outage / System Crash Patterns (English + Marathi)
  const isOutage = /(server|system|api|database|app|production|gateway).*(down|crash|offline|failed|dead|broken|unresponsive)|500|502|503|band padla|chalu hot nahi|kam karat nahi/.test(text);
  
  // Financial & Payment Crisis
  const isFinancial = /(payment|checkout|transaction|billing|invoice|credit card|refund).*(failed|stuck|broken|double)|losing (money|revenue|customers)|charged twice|paise kaple|payment zal nahi/.test(text);
  
  // Security & Lockout
  const isSecurity = /(account locked|locked out|2fa broken|unauthorized|hacked|password reset|login hot nahi)/.test(text);
  
  // High Churn / Legal Risk
  const isChurn = /(cancel (my )?(subscription|contract|service)|terminate contract|sue you|lawsuit|fraud|unacceptable|worst service)/.test(text);
  
  // Routine inquiry
  const isRoutine = /(how do i|how to|where can i|documentation|feedback|feature request|just wondering|kase karave|mahiti pahije)/.test(text);

  let urgency_score = 25;
  if (isOutage) urgency_score += 65;
  else if (isFinancial) urgency_score += 55;
  else if (isSecurity) urgency_score += 40;
  if (/urgent|emergency|immediately|asap|critical/.test(text)) urgency_score += 15;
  if (isRoutine && !isOutage && !isFinancial) urgency_score = Math.max(10, urgency_score - 15);

  // Customer declared priority modifier
  const prioStr = (customerPriority || 'Normal').toLowerCase();
  if (prioStr === 'low') urgency_score -= 5;
  else if (prioStr === 'high') urgency_score += 12;
  else if (prioStr === 'urgent') urgency_score += 22;

  urgency_score = Math.min(100, Math.max(10, urgency_score));

  let sentiment_score = 30;
  if (isChurn) sentiment_score += 45;
  if (isFinancial) sentiment_score += 25;
  if (/!{2,}/.test(text)) sentiment_score += 15;
  if (/[A-Z]{3,}/.test(`${subject} ${description}`)) sentiment_score += 15;
  sentiment_score = Math.min(100, Math.max(10, sentiment_score));

  const churn_risk_score = isChurn ? 90 : isFinancial ? 65 : 20;
  const customer_tier_score = customerType === 'VIP' ? 100 : customerType === 'Premium' ? 65 : 20;

  // Composite Weighted Score
  const total_priority_score = Math.min(100, Math.round(
    0.40 * urgency_score +
    0.40 * sentiment_score +
    0.20 * customer_tier_score
  ));

  let assigned_tier = 'Routine';
  let sla_minutes = 1440;
  if (total_priority_score >= 70) {
    assigned_tier = 'Critical';
    sla_minutes = 15;
  } else if (total_priority_score >= 35) {
    assigned_tier = 'Standard';
    sla_minutes = 120;
  }

  const now = new Date();
  const sla_due_at = new Date(now.getTime() + sla_minutes * 60000).toISOString();

  let diagnosis = "Standard support evaluation.";
  let solution = "Verify logs and investigate customer report.";
  if (isOutage && isFinancial) {
    diagnosis = "Critical Production Outage: Active checkout transaction failure impacting revenue.";
    solution = "Acknowledge the transaction freeze immediately. Verify payment webhook logs for 500 status codes, and update client with our 15m ETA.";
  } else if (isOutage) {
    diagnosis = "Infrastructure Outage: Production service disruption detected.";
    solution = "Prioritize immediate SRE incident triage. Check API gateway load and database connection pools.";
  } else if (isFinancial) {
    diagnosis = "Payment / Billing Anomaly: Financial transaction friction reported.";
    solution = "Audit customer billing ledger and payment gateway charge IDs. Reconcile any duplicate charges.";
  } else if (isSecurity) {
    diagnosis = "Account Access Blockage: User locked out or authentication failed.";
    solution = "Verify user identity via secondary authentication and issue a secure password reset link.";
  } else if (isChurn) {
    diagnosis = "High Churn Risk: Severe customer dissatisfaction reported.";
    solution = "Respond with high executive empathy, escalate to Senior Support Lead, and offer priority resolution.";
  }

  return {
    weights: { urgency: 0.40, sentiment: 0.40, customer_tier: 0.20 },
    metrics: { sentiment_score, urgency_score, churn_risk_score, customer_tier_score },
    total_priority_score,
    assigned_tier,
    sla_minutes,
    sla_due_at,
    diagnosis,
    suggested_solution: solution,
    escalated: assigned_tier === 'Critical',
    reasons: [
      `🧠 Cognitive AI Diagnosis: ${diagnosis}`,
      `Technical Urgency: ${urgency_score}/100`,
      `Sentiment Distress: ${sentiment_score}/100`,
      `Customer Tier Rating: ${customerType} (${customer_tier_score}pts)`,
      `💡 AI Suggested Solution: ${solution}`
    ]
  };
}

// Main mock router that intercepts API calls
export async function handleMockRequest(endpoint, options = {}) {
  // Simulate network latency (80ms - 150ms)
  await new Promise(r => setTimeout(r, 90));

  const db = loadDB();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const url = new URL(endpoint, 'https://dummy.base');
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // 1. AUTH / LOGIN
  // कमेंट: लॉगिन पडताळणी - सर्व ॲडमिन, एजंट आणि ग्राहकांसाठी
  if (pathname === '/auth/login' && method === 'POST') {
    const email = body.email ? body.email.toLowerCase().trim() : '';
    const password = body.password || '';
    const user = db.users.find(u => u.email.toLowerCase() === email);
    
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    // Verify password if explicitly stored on user
    if (user.password && user.password !== password) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const token = `demo_jwt_token_${user.id}_${Date.now()}`;
    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agent_level: user.agent_level,
        customer_type: user.customer_type,
        must_change_password: user.must_change_password || false
      }
    };
  }

  // 2. AUTH / REGISTER (ग्राहक स्वतः नोंदणी करतात)
  if (pathname === '/auth/register' && method === 'POST') {
    const cleanEmail = body.email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.status = 400;
      throw err;
    }

    const newUser = {
      id: `usr-cust-${Date.now().toString(36)}`,
      name: body.name || 'Customer',
      email: cleanEmail,
      role: 'customer',
      agent_level: null,
      customer_type: 'Regular',
      password: body.password, // स्टोर केलेला पासवर्ड
      is_active: 1,
      must_change_password: 0
    };
    db.users.push(newUser);
    
    // Audit log
    db.audit_logs.unshift({
      id: `aud-${Date.now()}`,
      action: 'USER_REGISTERED',
      details: `New customer self-registered: ${newUser.name} (${newUser.email})`,
      performed_by: newUser.email,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    const token = `demo_jwt_token_${newUser.id}_${Date.now()}`;
    return {
      access_token: token,
      token_type: 'bearer',
      user: newUser
    };
  }

  // 3. AUTH / ME
  if (pathname === '/auth/me') {
    const rawUser = localStorage.getItem('triagex_user');
    if (rawUser) {
      return JSON.parse(rawUser);
    }
    return db.users[0];
  }

  // 4. AUTH / DEMO USERS
  if (pathname === '/auth/demo-users') {
    return {
      admin: { email: 'admin@triagex.com', role: 'admin' },
      senior_agent: { email: 'senior@triagex.com', role: 'agent', agent_level: 'Senior' },
      agent: { email: 'agent@triagex.com', role: 'agent', agent_level: 'Standard' },
      customer: { email: 'customer@triagex.com', role: 'customer', customer_type: 'VIP' }
    };
  }

  // 5. TICKETS - LIST & PAGINATION
  if (pathname === '/tickets' && method === 'GET') {
    let list = [...db.tickets];
    const status = searchParams.get('status_filter');
    const tier = searchParams.get('tier_filter');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page'));
    const pageSize = parseInt(searchParams.get('page_size'));

    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    // Filter customer tickets
    if (currentUser && currentUser.role === 'customer') {
      list = list.filter(t => t.customer_id === currentUser.id || t.customer_email === currentUser.email);
    }

    if (status) list = list.filter(t => t.status.toLowerCase() === status.toLowerCase());
    if (tier) list = list.filter(t => t.assigned_tier.toLowerCase() === tier.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => 
        (t.ticket_number && t.ticket_number.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q))
      );
    }

    // Sort by priority descending
    list.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

    if (page && pageSize) {
      const total = list.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const items = list.slice(start, start + pageSize);
      return {
        items,
        total,
        page,
        page_size: pageSize,
        total_pages: totalPages
      };
    }
    return list;
  }

  // 6. PREVIEW SCORE
  if (pathname === '/tickets/preview-score' && method === 'POST') {
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    const custType = body.customer_type || (currentUser ? currentUser.customer_type : 'Regular') || 'Regular';
    return calculateClientPriority(body.subject || '', body.description || '', custType);
  }

  // 7. TICKET CREATE
  if (pathname === '/tickets' && method === 'POST') {
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    const custType = (currentUser && currentUser.customer_type) || 'Regular';
    const customerPriority = body.customer_priority || 'Normal';

    // Check for similar resolved ticket (Feature 5: Case-Based Historical Match)
    let historicalMatch = null;
    const searchTokens = (body.subject + ' ' + body.description).toLowerCase().match(/\b[a-z0-9_]{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'when', 'what', 'help', 'please', 'issue', 'problem', 'ticket']);
    const cleanTokens = new Set(searchTokens.filter(t => !stopWords.has(t)));

    if (cleanTokens.size > 0) {
      for (const pt of db.tickets) {
        if (pt.status === 'Resolved' && pt.resolution_note) {
          const ptTokens = (pt.subject + ' ' + (pt.description || '')).toLowerCase().match(/\b[a-z0-9_]{3,}\b/g) || [];
          const ptClean = new Set(ptTokens.filter(t => !stopWords.has(t)));
          const common = [...cleanTokens].filter(x => ptClean.has(x));
          const unionSize = cleanTokens.size + ptClean.size - common.length;
          const jaccard = unionSize > 0 ? (common.length / unionSize) : 0;
          if (common.length >= 2 && jaccard >= 0.35) {
            historicalMatch = {
              matched_ticket_id: pt.id,
              matched_ticket_number: pt.ticket_number,
              matched_subject: pt.subject,
              resolution_note: pt.resolution_note,
              similarity_score: Math.min(96, Math.round(jaccard * 100)),
              matched_keywords: common.slice(0, 5)
            };
            break;
          }
        }
      }
    }

    const expl = calculateClientPriority(body.subject, body.description, custType, customerPriority);
    const numId = Math.floor(1000 + Math.random() * 9000);
    const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
    
    const newTicket = {
      id: `t-${numId}`,
      ticket_number: `TX-${hex}`,
      customer_id: currentUser ? currentUser.id : 'usr-cust-vip1',
      customer_name: currentUser ? currentUser.name : 'Abhishek Kanadje',
      customer_email: currentUser ? currentUser.email : 'customer@triagex.com',
      customer_type: custType,
      channel: body.channel || 'web',
      category: body.category || 'General',
      subject: body.subject,
      description: body.description,
      status: 'Open',
      assigned_tier: expl.assigned_tier,
      priority_score: expl.total_priority_score,
      sentiment_score: expl.metrics.sentiment_score,
      urgency_score: expl.metrics.urgency_score,
      churn_risk_score: expl.metrics.churn_risk_score,
      assigned_agent_id: null,
      assigned_agent_name: null,
      created_at: new Date().toISOString(),
      sla_due_at: expl.sla_due_at,
      summary: `Automated predictive routing: ${expl.assigned_tier} priority assignment.`,
      explainability: {
        total_priority_score: expl.total_priority_score,
        assigned_tier: expl.assigned_tier,
        factors: [
          {
            factor: 'Cognitive Semantic Analysis',
            score: expl.metrics.urgency_score,
            weight: 40,
            contribution: Math.round(expl.metrics.urgency_score * 0.4),
            detail: `Diagnosed: ${expl.diagnosis} (Customer priority: ${customerPriority})`
          },
          {
            factor: 'Sentiment & Frustration',
            score: expl.metrics.sentiment_score,
            weight: 40,
            contribution: Math.round(expl.metrics.sentiment_score * 0.4),
            detail: `Sentiment distress: ${expl.metrics.sentiment_score}/100`
          },
          {
            factor: 'Customer Account Tier',
            score: expl.metrics.customer_tier_score,
            weight: 20,
            contribution: Math.round(expl.metrics.customer_tier_score * 0.2),
            detail: `${custType} Tier Account`
          }
        ],
        detected_keywords: ['Technical', 'Urgency', customerPriority],
        summary: `Cognitive AI Routing: ${expl.diagnosis}`
      },
      explainability_json: JSON.stringify(expl),
      attachments: body.attachments || [],
      allow_call: Boolean(body.allow_call),
      customer_phone: body.customer_phone || '',
      customer_priority: customerPriority,
      historical_match: historicalMatch,
      notification_sent: null,
      csat_rating: null,
      csat_feedback: null
    };

    db.tickets.unshift(newTicket);

    // If historical duplicate match found, automatically seed system resolution reply
    if (historicalMatch) {
      if (!db.replies[newTicket.id]) db.replies[newTicket.id] = [];
      db.replies[newTicket.id].push({
        id: `rep-${Date.now()}`,
        ticket_id: newTicket.id,
        author_id: null,
        author_name: 'AI Case-Based Reasoning',
        author_role: 'system',
        message: `Hello ${newTicket.customer_name},\n\n🔍 Our AI identified that a very similar inquiry was previously resolved in ticket **${historicalMatch.matched_ticket_number}** (${historicalMatch.similarity_score}% match):\n\n**Previous Question:** ${historicalMatch.matched_subject}\n**Proven Resolution:** ${historicalMatch.resolution_note}\n\nOur human support specialists are reviewing your request, but the above proven answer may help you right away!`,
        is_internal: false,
        created_at: new Date().toISOString(),
        attachments: []
      });
    }

    // If Critical, add notification
    if (expl.assigned_tier === 'Critical') {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: 'usr-senior-01',
        title: `🚨 Critical Ticket Escalated (${newTicket.ticket_number})`,
        message: `High urgency ticket "${newTicket.subject.slice(0, 40)}..." requires immediate response.`,
        ticket_id: newTicket.id,
        is_read: 0,
        created_at: new Date().toISOString()
      });
    }

    saveDB(db);
    return newTicket;
  }

  // 8. TICKET BY ID
  const ticketDetailMatch = pathname.match(/^\/tickets\/([^/]+)$/);
  if (ticketDetailMatch && method === 'GET') {
    const id = ticketDetailMatch[1];
    const ticket = db.tickets.find(t => t.id === id || t.ticket_number === id);
    if (!ticket) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    const isCustomer = currentUser && currentUser.role === 'customer';
    const allReps = db.replies[ticket.id] || [];
    return {
      ...ticket,
      replies: isCustomer ? allReps.filter(r => !r.is_internal) : allReps
    };
  }

  // 9. TICKET CLAIM
  const claimMatch = pathname.match(/^\/tickets\/([^/]+)\/claim$/);
  if (claimMatch && method === 'POST') {
    const id = claimMatch[1];
    const ticket = db.tickets.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');

    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    if (ticket.assigned_tier === 'Critical' && currentUser && currentUser.agent_level === 'Standard') {
      const err = new Error('Standard agents cannot claim Critical tier tickets. Requires Senior Agent escalation.');
      err.status = 403;
      throw err;
    }

    ticket.assigned_agent_id = currentUser ? currentUser.id : 'usr-senior-01';
    ticket.assigned_agent_name = currentUser ? currentUser.name : 'Pooja Sharma';
    ticket.status = 'In Progress';
    saveDB(db);
    return { message: 'Ticket claimed successfully', ticket };
  }

  // 10. TICKET RELEASE
  const releaseMatch = pathname.match(/^\/tickets\/([^/]+)\/release$/);
  if (releaseMatch && method === 'POST') {
    const id = releaseMatch[1];
    const ticket = db.tickets.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');
    ticket.assigned_agent_id = null;
    ticket.assigned_agent_name = null;
    ticket.status = 'Open';
    saveDB(db);
    return { message: 'Ticket released back to unassigned queue', ticket };
  }

  // 11. AUDIO CALL ENDPOINT (Feature 2)
  const callMatch = pathname.match(/^\/tickets\/([^/]+)\/call$/);
  if (callMatch && method === 'POST') {
    const tid = callMatch[1];
    const ticket = db.tickets.find(t => t.id === tid);
    if (!ticket) throw new Error('Ticket not found');

    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    const callerName = currentUser ? currentUser.name : 'Support Agent';
    const duration = body.duration_seconds || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const status = body.call_status || 'Completed';

    if (!db.replies[tid]) db.replies[tid] = [];
    const callRep = {
      id: `rep-call-${Date.now()}`,
      ticket_id: tid,
      author_id: null,
      author_name: callerName,
      author_role: 'system',
      message: `📞 Direct Audio Call (${status}) - Duration: ${mins}m ${secs < 10 ? '0' : ''}${secs}s. Handled with ${callerName}.`,
      is_internal: false,
      created_at: new Date().toISOString(),
      attachments: []
    };
    db.replies[tid].push(callRep);

    db.audit_logs.unshift({
      id: `aud-${Date.now()}`,
      ticket_id: tid,
      action: 'VOICE_CALL_LOGGED',
      details: `Direct audio call (${duration}s, Status: ${status}) with ${callerName}`,
      performed_by: callerName,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    return { success: true, call_log: callRep };
  }

  // Active Call Initiate
  const callInitMatch = pathname.match(/^\/tickets\/([^/]+)\/call\/initiate$/);
  if (callInitMatch && method === 'POST') {
    const tid = callInitMatch[1];
    const ticket = db.tickets.find(t => t.id === tid);
    if (!ticket) throw new Error('Ticket not found');
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    const callerName = currentUser ? currentUser.name : 'Customer';
    const callerRole = currentUser ? currentUser.role : 'customer';
    const callerPhone = body.caller_phone || ticket.customer_phone || '';
    db.active_calls = db.active_calls || {};
    db.active_calls[tid] = {
      id: `call-${Date.now()}`,
      ticket_id: tid,
      caller_name: callerName,
      caller_role: callerRole,
      caller_phone: callerPhone,
      status: 'ringing',
      started_at: new Date().toISOString()
    };
    saveDB(db);
    return db.active_calls[tid];
  }

  // Active Call Status
  const callStatusMatch = pathname.match(/^\/tickets\/([^/]+)\/call\/status$/);
  if (callStatusMatch && method === 'GET') {
    const tid = callStatusMatch[1];
    db.active_calls = db.active_calls || {};
    return db.active_calls[tid] || { status: 'none' };
  }

  // Active Call Answer
  const callAnswerMatch = pathname.match(/^\/tickets\/([^/]+)\/call\/answer$/);
  if (callAnswerMatch && method === 'POST') {
    const tid = callAnswerMatch[1];
    db.active_calls = db.active_calls || {};
    if (db.active_calls[tid]) {
      db.active_calls[tid].status = 'connected';
      saveDB(db);
      return db.active_calls[tid];
    }
    return { status: 'none' };
  }

  // Active Call End
  const callEndMatch = pathname.match(/^\/tickets\/([^/]+)\/call\/end$/);
  if (callEndMatch && method === 'POST') {
    const tid = callEndMatch[1];
    db.active_calls = db.active_calls || {};
    const curCall = db.active_calls[tid];
    if (curCall) {
      delete db.active_calls[tid];
      const duration = body.duration_seconds || 0;
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      if (!db.replies[tid]) db.replies[tid] = [];
      const callRep = {
        id: `rep-call-${Date.now()}`,
        ticket_id: tid,
        author_id: null,
        author_name: curCall.caller_name,
        author_role: 'system',
        message: `📞 Direct Audio Call (Completed) - Duration: ${mins}m ${secs < 10 ? '0' : ''}${secs}s. Handled with ${curCall.caller_name}.`,
        is_internal: false,
        created_at: new Date().toISOString(),
        attachments: []
      };
      db.replies[tid].push(callRep);
      saveDB(db);
      return { status: 'ended', call_log: callRep };
    }
    return { status: 'ended' };
  }

  // 12. TICKET STATUS & RESOLUTION NOTIFICATION (Feature 4)
  const statusMatch = pathname.match(/^\/tickets\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const id = statusMatch[1];
    const ticket = db.tickets.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');
    ticket.status = body.status || ticket.status;
    if (body.assigned_agent_id) ticket.assigned_agent_id = body.assigned_agent_id;
    if (body.assigned_agent_name) ticket.assigned_agent_name = body.assigned_agent_name;
    if (body.resolution_note) ticket.resolution_note = body.resolution_note;

    if (ticket.status === 'Resolved') {
      const nowIso = new Date().toISOString();
      const phone = ticket.customer_phone || '+91 98765 43210';
      const note = body.resolution_note || ticket.resolution_note || 'Resolved by support team.';
      ticket.resolved_at = nowIso;
      ticket.notification_sent = {
        dispatched_at: nowIso,
        email: {
          to: ticket.customer_email,
          status: 'Delivered',
          subject: `✅ [Resolved] Ticket ${ticket.ticket_number}: ${ticket.subject}`,
          body: `Dear ${ticket.customer_name},\n\nYour support ticket ${ticket.ticket_number} has been resolved.\n\nResolution Details:\n${note}\n\nBest regards,\nTriageX Operations`
        },
        sms: {
          to: phone,
          status: 'Delivered',
          body: `TriageX Alert: Your ticket ${ticket.ticket_number} is Resolved! Note: ${note.slice(0, 50)}... Thank you.`
        },
        summary: `Automated resolution confirmation sent via Email to ${ticket.customer_email} and SMS to ${phone}.`
      };

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: ticket.customer_id,
        title: `Ticket Resolved (${ticket.ticket_number})`,
        message: `Your ticket has been marked as Resolved. Automated SMS & Email confirmation dispatched.`,
        ticket_id: ticket.id,
        is_read: 0,
        created_at: nowIso
      });
    }

    saveDB(db);
    return { message: 'Status updated', ticket };
  }

  // 13. TICKET REPLIES (Feature 1: Attachments & Feature 6: Live Chat)
  const repliesMatch = pathname.match(/^\/tickets\/([^/]+)\/replies$/);
  if (repliesMatch) {
    const tid = repliesMatch[1];
    if (method === 'GET') {
      const list = db.replies[tid] || [];
      const rawUser = localStorage.getItem('triagex_user');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      if (currentUser && currentUser.role === 'customer') {
        return list.filter(r => !r.is_internal);
      }
      return list;
    }
    if (method === 'POST') {
      const rawUser = localStorage.getItem('triagex_user');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      if (!db.replies[tid]) db.replies[tid] = [];
      const newRep = {
        id: `rep-${Date.now()}`,
        ticket_id: tid,
        author_id: currentUser ? currentUser.id : 'usr-senior-01',
        author_name: currentUser ? currentUser.name : 'Support Agent',
        author_role: currentUser ? currentUser.role : 'agent',
        message: body.message,
        is_internal: Boolean(body.is_internal),
        created_at: new Date().toISOString(),
        attachments: body.attachments || []
      };
      db.replies[tid].push(newRep);
      saveDB(db);
      return newRep;
    }
  }

  // 13. CSAT RATING
  const csatMatch = pathname.match(/^\/tickets\/([^/]+)\/csat$/);
  if (csatMatch && method === 'POST') {
    const tid = csatMatch[1];
    const ticket = db.tickets.find(t => t.id === tid);
    if (!ticket) throw new Error('Ticket not found');
    ticket.csat_rating = body.rating;
    ticket.csat_feedback = body.feedback || '';
    saveDB(db);
    return { message: 'CSAT rating submitted', ticket };
  }

  // 14. AGENT STATS
  if (pathname === '/agent/stats') {
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : { role: 'agent', agent_level: 'Senior' };
    const myId = currentUser.id || 'usr-senior-01';

    const myOpen = db.tickets.filter(t => t.assigned_agent_id === myId && t.status !== 'Resolved').length;
    const unassigned = db.tickets.filter(t => !t.assigned_agent_id && t.status !== 'Resolved').length;
    const overdue = db.tickets.filter(t => {
      if (t.status === 'Resolved') return false;
      return new Date(t.sla_due_at) < new Date();
    }).length;
    const resolvedToday = db.tickets.filter(t => t.status === 'Resolved').length;

    return {
      my_open_count: myOpen,
      unassigned_in_tier_count: unassigned,
      overdue_sla_count: overdue,
      resolved_today_count: resolvedToday,
      agent_level: currentUser.agent_level || 'Senior',
      is_admin: currentUser.role === 'admin'
    };
  }

  // 15. ADMIN ANALYTICS
  if (pathname === '/admin/analytics') {
    const total = db.tickets.length;
    const critical = db.tickets.filter(t => t.assigned_tier === 'Critical').length;
    const standard = db.tickets.filter(t => t.assigned_tier === 'Standard').length;
    const routine = db.tickets.filter(t => t.assigned_tier === 'Routine').length;
    const resolved = db.tickets.filter(t => t.status === 'Resolved').length;
    const overdue = db.tickets.filter(t => t.status !== 'Resolved' && new Date(t.sla_due_at) < new Date()).length;

    return {
      total_tickets: total,
      critical_tickets: critical,
      standard_tickets: standard,
      routine_tickets: routine,
      resolved_tickets: resolved,
      overdue_sla_tickets: overdue,
      sla_compliance_rate: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
      avg_resolution_minutes: 24,
      tier_distribution: { Critical: critical, Standard: standard, Routine: routine }
    };
  }

  // 16. ADMIN USERS
  if (pathname === '/admin/users' && method === 'GET') {
    return db.users;
  }
  if (pathname === '/admin/agents' && method === 'POST') {
    const tempPassword = `Ag!${Math.random().toString(36).slice(-6)}#9`;
    const newAg = {
      id: `usr-agent-${Date.now().toString(36)}`,
      name: body.name,
      email: body.email.toLowerCase().trim(),
      role: 'agent',
      agent_level: body.agent_level || 'Standard',
      phone: body.phone || '+91 98765 12345',
      customer_type: null,
      password: tempPassword,
      is_active: 1,
      must_change_password: 1
    };
    db.users.push(newAg);
    db.audit_logs.unshift({
      id: `aud-${Date.now()}`,
      action: 'AGENT_CREATED',
      details: `Admin created support agent: ${newAg.name} (${newAg.email}) [Level: ${newAg.agent_level}]. Onboarding email with credentials dispatched.`,
      performed_by: 'admin@triagex.com',
      timestamp: new Date().toISOString()
    });
    saveDB(db);
    return {
      message: 'Agent created successfully and credentials dispatched via email',
      user: newAg,
      temporary_password: tempPassword,
      email_dispatched: true
    };
  }

  // 17. ADMIN FAQS
  if (pathname === '/admin/faqs' && method === 'GET') {
    return db.faqs;
  }
  if (pathname === '/admin/faqs' && method === 'POST') {
    const newFaq = {
      id: `faq-${Date.now().toString(36)}`,
      title: body.title,
      question: body.question,
      answer: body.answer,
      category: body.category || 'General',
      tags: body.tags || '',
      is_active: 1,
      match_count: 0
    };
    db.faqs.push(newFaq);
    saveDB(db);
    return newFaq;
  }
  if (pathname === '/admin/faqs/test' && method === 'POST') {
    const query = (body.query || '').toLowerCase();
    const matched = db.faqs.find(f => 
      f.title.toLowerCase().includes(query) || 
      f.question.toLowerCase().includes(query) ||
      f.tags.toLowerCase().includes(query)
    ) || db.faqs[0];

    return {
      matched: true,
      confidence: 0.94,
      faq: matched
    };
  }

  // 18. ADMIN SETTINGS
  if (pathname === '/admin/settings') {
    if (method === 'GET') return db.settings;
    if (method === 'POST') {
      db.settings = { ...db.settings, ...body };
      saveDB(db);
      return { message: 'Settings saved successfully', settings: db.settings };
    }
  }

  // 18.1 TEST GEMINI CONNECTION
  if (pathname === '/admin/test-gemini' && method === 'POST') {
    const key = body.gemini_api_key;
    if (!key || !key.trim()) throw new Error('Gemini API key is required');
    return {
      status: 'success',
      message: 'Successfully connected to Google Gemini AI (gemini-2.5-flash)!',
      test_evaluation: {
        priority_score: 88,
        urgency_score: 95.0,
        frustration_score: 85.0,
        assigned_tier: 'Critical',
        key_issue: 'Critical production checkout outage causing immediate revenue failure.',
        routing_reason: 'Direct AI LLM verified production downtime with severe business impact.',
        suggested_solution: 'Our technical infrastructure team has traced the gateway timeout and is rolling out the hotfix.'
      }
    };
  }

  // 19. AUDIT LOGS
  if (pathname === '/admin/audit-logs') {
    return db.audit_logs;
  }

  // 20. CANNED REPLIES
  if (pathname === '/canned-replies' && method === 'GET') {
    return db.canned_replies;
  }
  if (pathname === '/canned-replies' && method === 'POST') {
    const newCanned = {
      id: `canned-${Date.now()}`,
      shortcut: body.shortcut,
      title: body.title,
      category: body.category || 'General',
      content: body.content
    };
    db.canned_replies.push(newCanned);
    saveDB(db);
    return newCanned;
  }

  // 21. NOTIFICATIONS
  if (pathname === '/notifications' && method === 'GET') {
    return db.notifications;
  }
  if (pathname === '/notifications/read' && method === 'POST') {
    db.notifications.forEach(n => { n.is_read = 1; });
    saveDB(db);
    return { message: 'All marked as read' };
  }

  // 22. USER PROFILE
  if (pathname === '/user/profile' && method === 'PATCH') {
    const rawUser = localStorage.getItem('triagex_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : null;
    if (currentUser) {
      currentUser.name = body.name || currentUser.name;
      localStorage.setItem('triagex_user', JSON.stringify(currentUser));
      const u = db.users.find(x => x.id === currentUser.id);
      if (u) {
        u.name = currentUser.name;
        saveDB(db);
      }
      return currentUser;
    }
    return { name: body.name };
  }

  // 23. STATS
  if (pathname === '/stats') {
    return {
      total_tickets: db.tickets.length,
      resolved_tickets: db.tickets.filter(t => t.status === 'Resolved').length,
      avg_response_minutes: 18,
      satisfaction_rate: '98.4%'
    };
  }

  // 24. RESET DEMO DATA
  if (pathname === '/admin/reset-demo-data' && method === 'POST') {
    const fresh = getInitialState();
    saveDB(fresh);
    return { message: 'Database reset to default seed data' };
  }

  // Fallback
  return { success: true };
}
