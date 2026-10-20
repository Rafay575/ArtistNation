import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { SESSION_COOKIE, readServerSession, pageRedirect } from '@/lib/serverSession';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await readServerSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect('/login');
  const pathname = (await headers()).get('x-artistnation-path') || '/admin/dashboard';
  const destination = pageRedirect(pathname, user);
  if (destination) redirect(destination);
  return <DashboardShell>{children}</DashboardShell>;
}
