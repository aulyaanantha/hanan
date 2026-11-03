import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session/server';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect('/login');
  return children;
}
