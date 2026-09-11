export type NotificationCategory = 
  | 'Breakfast' | 'Lunch' | 'Dinner' | 'Medicine' 
  | 'Hydration' | 'Doctor' | 'Brain Activity' | 'Walk' 
  | 'Exercise' | 'Rest' | 'Family' | 'Custom';

export type NotificationStatus = 'SCHEDULED' | 'DELIVERED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'SNOOZED' | 'CAREGIVER_ALERT';

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  scheduledFor: Date;
  status: NotificationStatus;
  actionUrl?: string;
  requiresAcknowledgment?: boolean;
  type?: 'ROUTINE' | 'ALERT' | 'STANDARD';
};

// In-memory store for demo
export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    category: 'Medicine',
    title: 'Morning Medicine',
    message: 'Time to take your blood pressure medication.',
    scheduledFor: new Date(new Date().setHours(8, 0, 0, 0)),
    status: 'COMPLETED',
    requiresAcknowledgment: true
  },
  {
    id: 'n2',
    category: 'Hydration',
    title: 'Drink Water',
    message: 'Time for your second glass of water today.',
    scheduledFor: new Date(new Date().setHours(10, 30, 0, 0)),
    status: 'COMPLETED',
  },
  {
    id: 'n3',
    category: 'Brain Activity',
    title: 'Memory Match Game',
    message: 'Play your daily brain exercise to keep your mind sharp!',
    scheduledFor: new Date(new Date().setHours(14, 0, 0, 0)),
    status: 'SCHEDULED',
    actionUrl: '/play/memory-match'
  },
  {
    id: 'n4',
    category: 'Walk',
    title: 'Evening Walk',
    message: 'It is a beautiful evening. How about a 15-minute walk?',
    scheduledFor: new Date(new Date().setHours(17, 30, 0, 0)),
    status: 'SCHEDULED'
  }
];

export const getStatusColor = (status: NotificationStatus) => {
  switch (status) {
    case 'SCHEDULED': return 'var(--text-secondary)';
    case 'DELIVERED': return 'var(--accent-color)';
    case 'ACKNOWLEDGED': return 'var(--success-color)';
    case 'COMPLETED': return 'var(--success-color)';
    case 'SNOOZED': return 'var(--warning-color)';
    case 'CAREGIVER_ALERT': return 'var(--danger-color)';
    default: return 'var(--text-primary)';
  }
};
