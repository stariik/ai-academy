import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        AI Academy Demo
      </h1>
      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: "1.05rem",
          marginBottom: "2rem",
        }}
      >
        Test the AI-powered learning platform
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Admin Card */}
        <Link
          href="/admin"
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            textDecoration: "none",
            color: "inherit",
            transition: "border-color 0.15s",
          }}
        >
          <div
            style={{
              fontSize: "1.5rem",
              marginBottom: "0.5rem",
            }}
          >
            Admin Panel
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Upload documents, generate lessons with Gemini AI
          </p>
        </Link>

        {/* Student Card */}
        <Link
          href="/student"
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            textDecoration: "none",
            color: "inherit",
            transition: "border-color 0.15s",
          }}
        >
          <div
            style={{
              fontSize: "1.5rem",
              marginBottom: "0.5rem",
            }}
          >
            Student View
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Learn with AI teacher powered by Claude
          </p>
        </Link>
      </div>

      {/* AI Status */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--muted)",
          borderRadius: "8px",
          fontSize: "0.85rem",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          AI Models in Use
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            color: "var(--muted-foreground)",
          }}
        >
          <span>Lesson Generation: Google Gemini 2.0 Flash</span>
          <span>AI Teacher / Chat: Anthropic Claude Sonnet</span>
        </div>
      </div>
    </div>
  );
}
