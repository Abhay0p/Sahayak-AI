export type SyncAction = {
  id: string;
  type: 'SCORE_UPDATE' | 'NOTIFICATION_ACK' | 'PROFILE_UPDATE';
  payload: any;
  timestamp: number;
};

const SYNC_QUEUE_KEY = 'sahayak_offline_queue';

export const addToOfflineQueue = (action: Omit<SyncAction, 'id' | 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  
  const currentQueueStr = localStorage.getItem(SYNC_QUEUE_KEY);
  const queue: SyncAction[] = currentQueueStr ? JSON.parse(currentQueueStr) : [];
  
  queue.push({
    ...action,
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  });
  
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const getOfflineQueue = (): SyncAction[] => {
  if (typeof window === 'undefined') return [];
  const currentQueueStr = localStorage.getItem(SYNC_QUEUE_KEY);
  return currentQueueStr ? JSON.parse(currentQueueStr) : [];
};

export const clearOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_QUEUE_KEY);
};

export const processOfflineQueue = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} offline actions...`);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Clear after successful processing
  clearOfflineQueue();
  console.log('Offline queue processed successfully.');
};
