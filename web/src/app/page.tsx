import { redirect } from 'next/navigation';
import { getSession } from '@/auth';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect('/create');
  } else {
    redirect('/auth/sign-in');
  }
}
