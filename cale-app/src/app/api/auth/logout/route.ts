import { clearAuthResponse } from '@/lib/auth';

export async function POST() {
  return clearAuthResponse();
}
