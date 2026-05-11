import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const [categories, courses] = await Promise.all([getCategories(), getCourses()]);
  return <LandingClient categories={categories} courses={courses} />;
}
