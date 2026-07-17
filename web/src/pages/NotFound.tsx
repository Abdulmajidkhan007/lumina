import { Container } from '../components/Container';
import { Button } from '../components/Button';

export function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-magenta">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8">
        <Button kind="link" to="/" variant="primary">
          Back to home
        </Button>
      </div>
    </Container>
  );
}
