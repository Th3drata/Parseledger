import { redirect } from 'next/navigation';

export default function AppLayout() {
  // App is not yet open to the public — redirect to the coming-soon page.
  redirect('/signup');
}
