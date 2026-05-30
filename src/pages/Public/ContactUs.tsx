import { type FormEvent, useState } from 'react';
import { Mail, MapPin, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { PublicSiteFrame, buildEmailUrl } from './PublicSiteFrame';
import { CONTACT_EMAIL } from './publicSiteContent';

export default function ContactUs() {
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
      {(actions) => (
        <>
          <section className="border-b border-white/10 bg-[#0b1222] pt-32">
            <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">Contact</p>
                  <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    Talk to Gymmigo on WhatsApp first.
                  </h1>
                  <p className="max-w-2xl text-base font-semibold leading-7 text-white/50 sm:text-lg">
                    For demos, pricing, setup, members, trainers, owners, shop, or support, WhatsApp is the fastest path. Email remains available for formal queries.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => actions.openLead('general', 'contact page')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
                    Open WhatsApp <MessageCircle size={17} />
                  </button>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:text-white">
                    Email us <Mail size={17} />
                  </a>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ['WhatsApp', '+91 72082 21615', MessageCircle],
                    ['Email', CONTACT_EMAIL, Mail],
                    ['Parent', 'Zenrevo', ShieldCheck],
                  ].map(([label, value, Icon]) => (
                    <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
                      <Icon className="text-primary" size={22} />
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/30">{label as string}</p>
                      <p className="mt-2 break-words text-sm font-black text-white">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.045] p-6 sm:p-8">
                <div className="mb-6 flex items-start gap-4 rounded-lg border border-primary/20 bg-primary/10 p-5">
                  <Sparkles className="shrink-0 text-primary" size={26} />
                  <div>
                    <h2 className="text-xl font-black text-white">Prefer email?</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/50">
                      This form opens your email app with a prepared message. It does not submit to a backend.
                    </p>
                  </div>
                </div>
                <form onSubmit={submitEmail} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-lg border border-white/10 bg-[#090f1d] px-4 py-4 text-sm outline-none focus:border-primary/60" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-white/10 bg-[#090f1d] px-4 py-4 text-sm outline-none focus:border-primary/60" />
                  </div>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Tell us what you want to build with Gymmigo..." className="w-full resize-none rounded-lg border border-white/10 bg-[#090f1d] px-4 py-4 text-sm outline-none focus:border-primary/60" />
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
                    Open email draft <Mail size={17} />
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['For gym owners', 'Ask for demo, import workflows, QR setup, Club Road, pricing, or multi-gym rollout.'],
                  ['For members', 'Ask about gym discovery, trainer bookings, wallet, shop, rewards, or Migo AI.'],
                  ['For trainers', 'Ask about profile setup, packages, certifications, bookings, and session management.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.045] p-6">
                    <MapPin className="text-primary" size={23} />
                    <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}
