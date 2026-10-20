import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  // Whenever a user lands on the website, they log in through the website
  redirect('/login');
}

