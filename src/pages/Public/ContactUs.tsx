import { type FormEvent, useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { Container, Eyebrow } from '../../components/marketing/Site';
import { Reveal } from '../../components/marketing/Motion';
import { usePageMeta } from '../../components/marketing/usePageMeta';
import { PublicSiteFrame } from './PublicSiteFrame';
import { buildEmailUrl } from './publicLinks';
import { CONTACT_EMAIL } from './publicSiteContent';

const field =
  'w-full rounded-xl border border-border bg-background px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';

export default function ContactUs() {
  usePageMeta({ title: 'Contact Gymmigo', description: 'Reach the Gymmigo team on WhatsApp or email for gym listings, trainer access, pricing or support.' });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    const body = [
      'Hi Gymmigo team,',
      '',
      message || 'I want to know more about Gymmigo.',
      '',
      name ? `Name: ${name}` : '',
      phone ? `Phone: ${phone}` : '',
    ].filter(Boolean).join('\n');
    window.location.href = buildEmailUrl('Gymmigo contact request', body);
  };

  return (
    <PublicSiteFrame active="contact">
      {actions => (
        <section className="pb-24 pt-14 sm:pt-20">
          <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <Eyebrow>Contact</Eyebrow>
              <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[56px]">Talk to a person.</h1>
              <p className="mt-5 max-w-lg text-[18px] leading-8 text-ink-muted">
                WhatsApp is the quickest way to reach us, whether you run a gym, coach clients or need help with your account. We reply on working days.
              </p>
              <dl className="mt-10 divide-y divide-border border-y border-border">
                <div className="flex items-center justify-between gap-6 py-5">
                  <dt className="flex items-center gap-3 text-[15px] text-ink-subtle"><MessageCircle size={18} aria-hidden /> WhatsApp</dt>
                  <dd>
                    <button type="button" onClick={() => actions.openLead('general', 'contact page')} className="text-[15px] font-semibold text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink">
                      +91 72082 21615
                    </button>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6 py-5">
                  <dt className="flex items-center gap-3 text-[15px] text-ink-subtle"><Mail size={18} aria-hidden /> Email</dt>
                  <dd><a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-[15px] font-semibold text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink">{CONTACT_EMAIL}</a></dd>
                </div>
                <div className="flex items-center justify-between gap-6 py-5">
                  <dt className="text-[15px] text-ink-subtle">Company</dt>
                  <dd className="text-[15px] font-semibold">Zenrevo, India</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.08} className="rounded-3xl border border-border bg-surface p-7 sm:p-10">
              <h2 className="font-display text-[24px] font-bold tracking-[-0.02em]">Write to us</h2>
              <p className="mt-2 text-[15px] leading-6 text-ink-subtle">This opens your email app with the message ready to send.</p>
              <form onSubmit={submitEmail} className="mt-7 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Name</span>
                    <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={field} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Phone</span>
                    <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" className={field} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Message</span>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="For example: I run a gym in Pune with about 300 members." className={`${field} resize-none`} />
                </label>
                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-background transition-opacity hover:opacity-90">
                  Open email draft <Mail size={16} />
                </button>
              </form>
            </Reveal>
          </Container>
        </section>
      )}
    </PublicSiteFrame>
  );
}
