import { useState, type FormEvent } from 'react';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { Button } from '../components/Button';
import { GitHubIcon } from '../components/icons';
import { CONTACT_EMAIL } from '../components/Footer';
import { useI18n } from '../i18n';
import { sendContactMessage } from '../lib/contactMessages';

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const INITIAL_STATE: ContactFormState = { name: '', email: '', message: '' };

type SendState = 'idle' | 'sending' | 'sent' | 'error';

const INPUT_CLASS =
  'mt-2 w-full rounded-xl border border-border bg-bg-elevated/60 px-4 py-3 text-text placeholder:text-text-faint focus:border-brand-magenta focus:outline-none';

export function Contact() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [state, setState] = useState<SendState>('idle');

  const handleChange =
    (field: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  // Saved to Firestore (Admin → Messages) — it used to open the visitor's mail
  // app, so nothing reached the admin panel and phones without mail did nothing.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      await sendContactMessage({ ...form, lang });
      setForm(INITIAL_STATE);
      setState('sent');
    } catch (error) {
      console.error('[contact] message not sent', error);
      setState('error');
    }
  };

  return (
    <Container className="py-20 sm:py-28">
      <Reveal as="div" className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('Get in touch')}</h1>
        <p className="mt-6 text-lg text-text-muted">
          {t("Questions, feedback, or partnership ideas — we'd love to hear from you.")}
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5">
        <Reveal as="form" className="lg:col-span-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-text">
                {t('Name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={80}
                value={form.name}
                onChange={handleChange('name')}
                className={INPUT_CLASS}
                placeholder={t('Your name')}
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-text">
                {t('Email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={120}
                value={form.email}
                onChange={handleChange('email')}
                className={INPUT_CLASS}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-text">
                {t('Message')}
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={5}
                maxLength={2000}
                rows={5}
                value={form.message}
                onChange={handleChange('message')}
                className={`${INPUT_CLASS} resize-none`}
                placeholder={t("Tell us what's on your mind...")}
              />
            </div>

            <Button
              kind="button"
              type="submit"
              variant="primary"
              className="self-start"
              disabled={state === 'sending'}
            >
              {state === 'sending' ? t('Sending…') : t('Send message')}
            </Button>
            {state === 'sent' ? (
              <p role="status" className="text-sm text-emerald-400">
                {t('Thanks! Your message was sent — we will reply by email.')}
              </p>
            ) : null}
            {state === 'error' ? (
              <p role="alert" className="text-sm text-red-400">
                {t('The message could not be sent. Check your connection and try again, or email {email}.', {
                  email: CONTACT_EMAIL,
                })}
              </p>
            ) : null}
          </div>
        </Reveal>

        <Reveal
          as="aside"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated/60 p-8 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-text">{t('Other ways to reach us')}</h2>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-text-muted hover:text-text">
            {CONTACT_EMAIL}
          </a>
          <a
            href="https://github.com/abdulmajidkhan007"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
          >
            <GitHubIcon className="h-5 w-5" />
            GitHub
          </a>
        </Reveal>
      </div>
    </Container>
  );
}
