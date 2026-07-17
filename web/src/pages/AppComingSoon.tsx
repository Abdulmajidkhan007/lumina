import { Container } from '../components/Container';
import { Button } from '../components/Button';

export function AppComingSoon() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-2xl font-bold text-white">
        L
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Web app coming soon</h1>
      <p className="mt-4 max-w-md text-text-muted">
        Sign-in and the full Lumina experience in the browser are on the way. In the meantime,
        grab the Android app to start sharing.
      </p>
      <div className="mt-8">
        <Button kind="link" to="/product" variant="primary">
          See the app
        </Button>
      </div>
    </Container>
  );
}
