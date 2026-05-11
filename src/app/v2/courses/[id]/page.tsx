import { notFound } from 'next/navigation';
import CourseDetailClient from './_components/CourseDetailClient';
import { getCoursePayload } from '@/lib/v2/db';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getCoursePayload(id);
  if (!payload) return notFound();

  return (
    <CourseDetailClient
      course={payload.course}
      category={payload.category}
      detail={payload.detail}
      related={payload.related}
    />
  );
}
