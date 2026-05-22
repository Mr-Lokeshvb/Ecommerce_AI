// Type definitions and constants for ticket system

const TICKET_CATEGORIES = [
  'Product',
  'Order',
  'Payment',
  'Shipping',
  'Return',
  'Technical',
  'Account',
  'Other'
];

const TICKET_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const TICKET_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in-progress',
  WAITING_CUSTOMER: 'waiting-customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const AGENT_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  AWAY: 'away',
  OFFLINE: 'offline'
};

const AGENT_ROLES = {
  AGENT: 'SUPPORT_AGENT',
  MANAGER: 'SUPPORT_MANAGER',
  ADMIN: 'SUPPORT_ADMIN'
};

const AGENT_DEPARTMENTS = [
  'general',
  'technical',
  'billing',
  'shipping',
  'returns',
  'vip'
];

// SLA Response Times (in hours)
const SLA_RESPONSE_TIMES = {
  urgent: 1,
  high: 4,
  medium: 12,
  low: 24
};

// SLA Resolution Times (in hours)
const SLA_RESOLUTION_TIMES = {
  urgent: 4,
  high: 24,
  medium: 48,
  low: 72
};

module.exports = {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUS,
  AGENT_STATUS,
  AGENT_ROLES,
  AGENT_DEPARTMENTS,
  SLA_RESPONSE_TIMES,
  SLA_RESOLUTION_TIMES
};
