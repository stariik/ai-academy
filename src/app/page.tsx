import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-[700px] px-6 py-12">
      <h1 className="mb-2 text-[2rem] font-bold">
        AI Academy Demo
      </h1>
      <p className="mb-8 text-[1.05rem] text-[var(--muted-foreground)]">
        Test the AI-powered learning platform
      </p>

      <div className="mb-10 grid grid-cols-2 gap-4">
        {/* Admin Card */}
        <Link
          href="/admin"
          className="block rounded-xl border border-[var(--border)] p-6 no-underline text-inherit transition-[border-color] duration-150"
          aria-label="Go to Admin Panel - Upload documents, generate lessons with Gemini AI"
        >
          <div className="mb-2 text-2xl">
            Admin Panel
          </div>
          <p className="m-0 text-sm leading-normal text-[var(--muted-foreground)]">
            Upload documents, generate lessons with Gemini AI
          </p>
        </Link>

        {/* Student Card */}
        <Link
          href="/student"
          className="block rounded-xl border border-[var(--border)] p-6 no-underline text-inherit transition-[border-color] duration-150"
          aria-label="Go to Student View - Learn with AI teacher powered by Claude"
        >
          <div className="mb-2 text-2xl">
            Student View
          </div>
          <p className="m-0 text-sm leading-normal text-[var(--muted-foreground)]">
            Learn with AI teacher powered by Claude
          </p>
        </Link>
      </div>

      {/* AI Status */}
      <div
        className="rounded-lg bg-[var(--muted)] px-5 py-4 text-[0.85rem]"
        role="status"
        aria-label="AI models currently in use"
      >
        <div className="mb-2 font-semibold">
          AI Models in Use
        </div>
        <div className="flex flex-col gap-1 text-[var(--muted-foreground)]">
          <span>Lesson Generation: Google Gemini 2.0 Flash</span>
          <span>AI Teacher / Chat: Anthropic Claude Sonnet</span>
        </div>
      </div>
    </div>
  );
}
