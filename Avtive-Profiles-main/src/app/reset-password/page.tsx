import { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | Avtive Identity Workspaces',
  description: 'Set a new password for your Avtive account.'
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
