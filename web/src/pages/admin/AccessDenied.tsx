import { Container } from '../../components/Container';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';

export function AccessDenied() {
  const { firebaseUser } = useAuth();
  const { t } = useI18n();

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-magenta">403</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('Access denied')}</h1>
      <p className="mt-4 max-w-md text-text-muted">
        {firebaseUser
          ? t("{email} doesn't have access to the Lumina admin panel.", { email: firebaseUser.email ?? t('This account') })
          : t('Sign in with the Lumina admin account to view this page.')}
      </p>
      <div className="mt-8">
        <Button kind="link" to={firebaseUser ? '/' : '/app/login'} variant="primary">
          {firebaseUser ? t('Back to home') : t('Sign in')}
        </Button>
      </div>
    </Container>
  );
}
