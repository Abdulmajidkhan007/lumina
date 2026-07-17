import { useState, type FormEvent } from 'react';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { Button } from '../components/Button';
import { GitHubIcon } from '../components/icons';
import { CONTACT_EMAIL } from '../components/Footer';

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const INITIAL_STATE: ContactFormState = { name: '', email: '', message: '' };

export function Contact() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);

  const handleChange =
    (field: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Lumina contact form: ${form.name || 'New message'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <Container className="py-20 sm:py-28">
      <Reveal as="div" className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Get in touch</h1>
        <p className="mt-6 text-lg text-text-muted">
          Questions, feedback, or partnership ideas — we&apos;d love to hear from you.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5">
        <Reveal as="form" className="lg:col-span-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-text">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange('name')}
                className="mt-2 w-full rounded-xl border border-border bg-bg-elevated/60 px-4 py-3 text-text placeholder:text-text-faint focus:border-brand-magenta focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                className="mt-2 w-full rounded-xl border border-border bg-bg-elevated/60 px-4 py-3 text-text placeholder:text-text-faint focus:border-brand-magenta focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-text">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange('message')}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-bg-elevated/60 px-4 py-3 text-text placeholder:text-text-faint focus:border-brand-magenta focus:outline-none"
                placeholder="Tell us what's on your mind..."
              />
            </div>

            <Button kind="button" type="submit" variant="primary" className="self-start">
              Send message
            </Button>
            <p className="text-xs text-text-faint">
              Submitting opens your email client, addressed to {CONTACT_EMAIL}.
            </p>
          </div>
        </Reveal>

        <Reveal
          as="aside"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated/60 p-8 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-text">Other ways to reach us</h2>
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
