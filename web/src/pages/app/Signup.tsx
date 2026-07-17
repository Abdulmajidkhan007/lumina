import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../../lib/auth';
import { FormField } from '../../components/FormField';

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('auth/email-already-in-use')) return 'This email is already registered.';
    if (err.message.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
    if (err.message.includes('popup-closed')) return '';
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    setPending(true);
    try {
      await signUpWithEmail({
        email,
        password,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const google = async () => {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/app', { replace: true });
    } catch (err) {
      const msg = errorMessage(err);
      if (msg) setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-8 block text-center bg-gradient-brand bg-clip-text text-4xl font-extrabold tracking-tight text-transparent"
        >
          Lumina
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl">
          <h1 className="mb-6 text-center text-xl font-bold">Create your account</h1>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormField
              label="Username"
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <FormField
              label="Display name"
              id="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <FormField
              label="Password"
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? (
              <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-brand py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={google}
            className="w-full rounded-xl border border-border bg-bg py-2.5 text-sm font-semibold transition hover:bg-white/5"
          >
            Continue with Google
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/app/login" className="font-semibold text-brand-magenta hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
