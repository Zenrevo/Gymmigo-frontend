import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import {
  FAQBlock,
  PublicSiteFrame,
  SectionHeader,
  TrustBand,
  toneStyles,
} from './PublicSiteFrame';
import { pricingPlans } from './publicSiteContent';

const pricingFaqs = [
  {
    question: 'Can I pay directly from this page?',
    answer: 'No. Public pricing is consultation-first. Gymmigo opens WhatsApp so the team can understand your gym size, features, and rollout needs before quoting.',
  },
  {
    question: 'Do members or trainers pay separately?',
    answer: 'Members and trainers can use their respective app journeys. Commercial terms depend on the gym, trainer package, shop purchase, or partnership setup.',
  },
  {
    question: 'Is there setup support?',
    answer: 'Yes. The public flow is WhatsApp-first so onboarding, gym setup, role setup, and shop/reward guidance can be handled personally.',
  },
];

export default function PricingPage() {
  return (
    <PublicSiteFrame active="pricing">
      {(actions) => (
        <>
          <section className="border-b border-white/10 bg-[#0b1222] pt-32">
            <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
              <div className="max-w-4xl space-y-6">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">Pricing</p>
                <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Public pricing that starts with the right conversation.
                </h1>
                <p className="max-w-2xl text-lg font-semibold leading-8 text-white/60">
                  Gymmigo setup depends on your gym operations, member volume, trainer model, shop needs, and growth goals. Use WhatsApp for the fastest quote.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => actions.openLead('pricing', 'pricing hero')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black"
                  >
                    Talk on WhatsApp <MessageCircle size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.openShop()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:text-white"
                  >
                    Shop link <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <TrustBand />

          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                eyebrow="Plans"
                title="Choose the launch path."
                copy="These are public package shapes, not checkout plans. The final quote is confirmed on WhatsApp after setup details."
              />
              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                {pricingPlans.map((plan) => {
                  const tone = toneStyles[plan.tone];
                  return (
                    <div
                      key={plan.name}
                      className={`relative rounded-xl border bg-white/[0.045] p-6 ${plan.featured ? 'border-primary/40 shadow-[0_20px_80px_rgba(241,130,44,0.14)]' : 'border-white/10'}`}
                    >
                      {plan.featured && (
                        <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                          Popular
                        </span>
                      )}
                      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${tone.bg} ${tone.border}`}>
                        <ShieldCheck className={tone.text} size={22} />
                      </div>
                      <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                      <p className="mt-2 min-h-[48px] text-sm font-semibold leading-6 text-white/50">{plan.audience}</p>
                      <p className="mt-6 text-3xl font-black tracking-tight text-white">{plan.price}</p>
                      <button
                        type="button"
                        onClick={() => actions.openLead('pricing', `${plan.name} pricing card`)}
                        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-4 text-xs font-black uppercase tracking-widest transition ${plan.featured ? 'bg-primary text-black' : 'border border-white/10 bg-white/[0.06] text-white/75 hover:text-white'}`}
                      >
                        Talk on WhatsApp <MessageCircle size={16} />
                      </button>
                      <div className="mt-6 space-y-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-white/60">
                            <CheckCircle2 className="mt-1 shrink-0 text-primary" size={16} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-white/[0.025] py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeader eyebrow="FAQ" title="Pricing questions." copy="Simple public answers before the WhatsApp quote conversation." />
              <FAQBlock faqs={pricingFaqs} />
            </div>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}
