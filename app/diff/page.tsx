import { getLocale } from 'next-intl/server';
import { redirect } from '@/navigation';

export default async function DiffRootRedirect() {
  const locale = await getLocale();
  redirect(`/${locale}/diff`);
}
