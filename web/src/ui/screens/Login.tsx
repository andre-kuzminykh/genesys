import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { GithubIcon } from '../design/Icon';

export function Login() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 place-items-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          <Bento padding="p-8" className="glow-yellow">
            <div className="flex justify-center">
              <Wordmark size="2xl" />
            </div>

            <a href="/auth/github" className="neon-button -mt-6 w-full text-lg">
              <GithubIcon size={22} /> Continue with GitHub
            </a>
          </Bento>
        </div>
      </div>
      <Footer />
      <CookieBanner />
    </div>
  );
}
