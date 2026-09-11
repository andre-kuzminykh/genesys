import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';

export function Terms() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home"><Wordmark size="lg" /></Link>
        <Link to="/" className="ghost-button"><span aria-hidden>←</span> Back</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-12">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Terms of Use</h1>
        <p className="mt-2 text-textsec">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>

        <Section title="1. What this is">
          Genesys is a demo platform run by Andre AI Technologies for the GENESYS-001 cohort.
          It lets cohort founders showcase a startup, lets cohort investors upvote and allocate
          play-money credits, and renders LLM-driven analytics. There is no real money
          exchanged through the platform.
        </Section>

        <Section title="2. Eligibility">
          Voting and investment actions are limited to GitHub handles on the cohort
          allowlist (see the seed in the public repository). Browsing is open to anyone.
        </Section>

        <Section title="3. Acceptable use">
          You agree not to misuse the platform: no automated scraping that disrupts service,
          no attempts to break the allowlist, no impersonation of cohort members. The
          GitHub OAuth flow proves you control the account you log in with.
        </Section>

        <Section title="4. Demo content">
          All forecasts, market reviews and recommendations on the platform are produced by
          an LLM panel and a deterministic mock model. They are NOT financial advice and
          they make no claim about real-world performance of the listed projects.
        </Section>

        <Section title="5. No warranty">
          The platform is provided "as is" without warranty of any kind. We may take it
          down, reset state, or change behaviour at any time during the demo run.
        </Section>

        <Section title="6. Contact">
          Questions: open an issue against the GitHub repository or reach out via any of
          the socials in the footer.
        </Section>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <p className="mt-2 leading-relaxed text-textsec">{children}</p>
    </section>
  );
}
