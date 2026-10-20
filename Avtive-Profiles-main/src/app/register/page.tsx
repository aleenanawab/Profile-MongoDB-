import React from 'react';
import RegisterClient from './RegisterClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Register | Avtive',
  description: 'Create your digital identity profile on Avtive.'
};

export default function RegisterPage() {
  return <RegisterClient />;
}
