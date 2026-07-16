// Shown when an account exceeds the distinct-IP limit (7 per 30 days) and
// tries to sign in from yet another network. Middleware redirects here and
// skips the check for this path. Bilingual inline — sits outside the
// [locale] segment so the dict system doesn't reach it.

export const metadata = { title: 'Access limit reached — walle.academy' };

export default function IpLimitPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-background text-foreground px-6">
      <div className="max-w-lg w-full rounded-3xl border border-border bg-card p-8 sm:p-10 text-center space-y-6">
        <span className="text-5xl" aria-hidden>
          🔒
        </span>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">ანგარიშის წვდომის ლიმიტი ამოიწურა</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            თქვენი ანგარიში ბოლო 30 დღეში 7-ზე მეტი სხვადასხვა ქსელიდან იყო გამოყენებული.
            ანგარიში პირადია — მისი გაზიარება წესებით აკრძალულია, ამიტომ ახალი ქსელიდან
            შესვლა დროებით დაბლოკილია. უკვე გამოყენებული ქსელებიდან წვდომა კვლავ მუშაობს.
          </p>
        </div>

        <hr className="border-border" />

        <div className="space-y-2">
          <h2 className="text-lg font-bold">Account access limit reached</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account has been used from more than 7 different networks in the last 30
            days. Accounts are personal and may not be shared, so sign-ins from new
            networks are temporarily blocked. Access from your existing networks still
            works.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          შეცდომაა? / Think this is a mistake?{' '}
          <a href="mailto:walle.academy.2026@gmail.com" className="font-semibold text-pulse hover:underline">
            walle.academy.2026@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
