import { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Forgot Password | Avtive Identity Workspaces',
  description: 'Reset your Avtive account password using secure email verification.'
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
