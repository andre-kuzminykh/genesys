import { Link } from 'react-router-dom';
import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon } from '../design/Icon';

export function Login() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md text-center">
        <Link to="/" aria-label="Genesys home" className="mx-auto mb-10 inline-block">
          <Wordmark size="xl" />
        </Link>

        <Bento padding="p-7" className="mt-10 glow-yellow">
          <div className="flex items-center justify-center gap-2 font-display text-xl font-extrabold">
            <GithubIcon size={20} />
            <span>Sign in with GitHub</span>
          </div>

          <a href="/auth/github" className="neon-button mt-6 w-full text-lg">
            <GithubIcon size={22} /> Continue with GitHub
          </a>
        </Bento>
      </div>
    </div>
  );
}
