import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';

export function Privacy() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home"><Wordmark size="lg" /></Link>
        <Link to="/" className="ghost-button"><span aria-hidden>←</span> Back</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-12">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-textsec">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>

        <Section title="1. What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li><b>GitHub session</b>: your GitHub login + the OAuth access token you
              authorise the app to use. The token is stored in your browser localStorage and
              sent only with calls to <code>api.github.com</code> and our backend.</li>
            <li><b>Votes + investments</b>: each upvote / play-money investment is stored
              server-side in <code>/data/state.json</code> alongside your GitHub login.</li>
            <li><b>OAuth state</b>: a short random string used to defend against CSRF.</li>
          </ul>
        </Section>

        <Section title="2. What we do NOT collect">
          No analytics SDKs, no tracking pixels, no advertising cookies, no third-party
          fingerprinting. The only "cookie-equivalent" is the localStorage entry that lets
          us keep your session between page loads.
        </Section>

        <Section title="3. LLM analysis">
          When you trigger the cohort simulation we send each startup's public metadata
          (name, pitch, hashtags, description) to OpenAI for analysis. We do not send your
          GitHub token or personal identifiers as part of those prompts.
        </Section>

        <Section title="4. Data retention">
          Cohort votes and investments live as long as the demo deployment is up. Deleting
          your GitHub authorization at <a className="text-neon-500 hover:underline" href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">github.com/settings/applications</a> revokes our access immediately.
        </Section>

        <Section title="5. Contact">
          Questions or removal requests: open an issue on the GitHub repository or reach
          out via the socials in the footer.
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
      <div className="mt-2 leading-relaxed text-textsec">{children}</div>
    </section>
  );
}
