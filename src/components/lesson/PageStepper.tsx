'use client';

import type { LessonPage } from '@/types';

export function PageStepper({
  pages,
  currentPage,
  completedPages,
  allPagesCompleted,
  onPageClick,
  onQuizClick,
}: {
  pages: LessonPage[];
  currentPage: number;
  completedPages: number[];
  allPagesCompleted: boolean;
  onPageClick: (pageNum: number) => void;
  onQuizClick: () => void;
}) {
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Lesson Pages
      </h3>
      <nav className="stepper-rail space-y-0.5 relative" aria-label="Lesson pages">
        {sortedPages.map((page) => {
          const isCompleted = completedPages.includes(page.pageNumber);
          const isCurrent = page.pageNumber === currentPage;
          const isLocked =
            !isCompleted &&
            !isCurrent &&
            page.pageNumber > 1 &&
            !completedPages.includes(page.pageNumber - 1);

          return (
            <button
              key={page.id}
              onClick={() => !isLocked && onPageClick(page.pageNumber)}
              disabled={isLocked}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Page ${page.pageNumber}: ${page.title}${isCompleted ? ' (completed)' : isLocked ? ' (locked)' : ''}`}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition relative z-10 ${
                isCurrent
                  ? 'bg-blue-50 font-medium text-blue-700 page-active-glow'
                  : isCompleted
                  ? 'text-green-700 hover:bg-green-50/50'
                  : isLocked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xs" aria-hidden="true">
                {isCompleted ? (
                  <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-2 ring-emerald-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </span>
                ) : isCurrent ? (
                  <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shadow-sm ring-2 ring-blue-200">
                    {page.pageNumber}
                  </span>
                ) : isLocked ? (
                  <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                ) : (
                  <span className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-500 flex items-center justify-center font-medium">
                    {page.pageNumber}
                  </span>
                )}
              </span>
              <span className="truncate flex-1">{page.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Final Quiz entry */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={onQuizClick}
          disabled={!allPagesCompleted}
          aria-label={`Final Quiz${allPagesCompleted ? '' : ' (locked - complete all pages first)'}`}
          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition ${
            allPagesCompleted
              ? 'bg-linear-to-r from-emerald-50 to-blue-50 text-emerald-700 font-medium ring-1 ring-inset ring-emerald-200 hover:ring-emerald-300'
              : 'text-gray-400 cursor-not-allowed bg-gray-50/50'
          }`}
        >
          <span className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xs" aria-hidden="true">
            {allPagesCompleted ? (
              <span className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            ) : (
              <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
            )}
          </span>
          <span>Final Quiz</span>
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Progress
          </h3>
          <span className="text-sm font-semibold text-gray-700" aria-label={`${Math.round((completedPages.length / pages.length) * 100)} percent complete`}>
            {Math.round((completedPages.length / pages.length) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={completedPages.length} aria-valuemin={0} aria-valuemax={pages.length}>
          <div
            className="h-2 rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(completedPages.length / pages.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {completedPages.length} of {pages.length} pages complete
        </p>
      </div>
    </div>
  );
}
