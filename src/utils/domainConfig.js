export const domainConfig = {
  time: {
    icon: '⏰',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    borderColor: '#C084FC',
    name: 'Time Perspective'
  },
  social: {
    icon: '🤝',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    name: 'Social Reasoning'
  },
  evidence: {
    icon: '🔍',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    name: 'Evidence Analysis'
  },
  logic: {
    icon: '🧩',
    color: '#10B981',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    name: 'Logic & Patterns'
  },
  risk: {
    icon: '⚠️',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
    name: 'Risk Assessment'
  },
  probability: {
    icon: '🎲',
    color: '#14B8A6',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    name: 'Probability'
  },
  critical: {
    icon: '🧠',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    name: 'Critical Thinking'
  },
  metacognition: {
    icon: '💭',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    borderColor: '#C084FC',
    name: 'Metacognition'
  }
};

export const getDomainConfig = (domain) => {
  return domainConfig[domain] || {
    icon: '💡',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    borderColor: '#A5B4FC',
    name: domain
  };
};
