import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/v2/i18n';

export default function V2RootPage() {
  redirect(`/v2/${DEFAULT_LOCALE}`);
}
