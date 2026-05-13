import { use } from 'react';
import LessonClient from './_components/LessonClient';

export const dynamic = 'force-dynamic';

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LessonClient lessonId={id} />;
}
