import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon } from '../design/Icon';

export function Login() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md text-center">
        <Bento padding="p-8" className="glow-yellow">
          <div className="flex justify-center">
            <Wordmark size="2xl" />
          </div>

          <a href="/auth/github" className="neon-button mt-8 w-full text-lg">
            <GithubIcon size={22} /> Continue with GitHub
          </a>
        </Bento>
      </div>
    </div>
  );
}
