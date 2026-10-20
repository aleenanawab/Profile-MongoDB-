import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Login | Avtive',
  description: 'Sign in to your Avtive digital profile account.'
};

interface LoginPageProps {
  searchParams: Promise<{ returnUrl?: string; registered?: string }>;
}

export default function LoginPage() {
  return <LoginClient />;
}
