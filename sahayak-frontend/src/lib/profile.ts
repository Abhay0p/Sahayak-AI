import { apiClient } from '@/lib/apiClient';
export async function updateProfile(data: any) {
  // apiClient already parses JSON and throws on error (e.g. if status is not ok)
  const res = await apiClient('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return res;
}
