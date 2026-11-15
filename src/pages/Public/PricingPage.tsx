import { Check } from 'lucide-react';
import { Container, Eyebrow, Faq } from '../../components/marketing/Site';
import { AboveFold, Reveal } from '../../components/marketing/Motion';
import { usePageMeta } from '../../components/marketing/usePageMeta';
import { cn } from '../../components/kit/cn';
import { PublicSiteFrame } from './PublicSiteFrame';
import { pricingFaqs, pricingPlans } from './publicSiteContent';

export default function PricingPage() {
  usePageMeta({
    title: 'Pricing: Gymmigo for gyms',
    description: 'Gymmigo is free for members. Gyms choose Launch, Growth or Network, priced on a short call to fit their size.',
  });
  return (
    <PublicSiteFrame active="pricing">
      {actions => (
        <>
          <AboveFold>
          <section className="pb-16 pt-14 sm:pt-20">
            <Container>
              <Reveal className="max-w-2xl">
                <Eyebrow>Pricing</Eyebrow>
                <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[56px]">Free for members. Fair for gyms.</h1>
                <p className="mt-5 text-[18px] leading-8 text-ink-muted">
                  Members never pay Gymmigo. Gyms pick the setup that fits, and we agree the monthly price together after a short call.
                </p>
              </Reveal>
            </Container>
          </section>
          </AboveFold>

          <section className="pb-24">
            <Container className="grid gap-5 lg:grid-cols-3">
              {pricingPlans.map((plan, i) => (
                <Reveal
                  key={plan.name}
                  delay={i * 0.07}
                  className={cn(
                    'flex flex-col rounded-3xl border p-8',
                    plan.featured ? 'border-ink bg-ink text-background' : 'border-border bg-surface',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-[24px] font-bold tracking-[-0.02em]">{plan.name}</h2>
                    {plan.featured ? <span className="rounded-full bg-cta px-3 py-1 text-[12px] font-semibold text-white">Recommended</span> : null}
                  </div>
                  <p className={cn('mt-2 text-[15px] leading-6', plan.featured ? 'opacity-70' : 'text-ink-subtle')}>{plan.audience}</p>
                  <p className="mt-8 font-display text-[32px] font-extrabold tracking-[-0.03em]">{plan.price}</p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex gap-3 text-[15px] leading-6">
                        <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                        <span className={plan.featured ? 'opacity-85' : 'text-ink-muted'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => actions.openLead('pricing', `pricing ${plan.name}`)}
                    className={cn(
                      'mt-10 inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      plan.featured ? 'bg-cta text-white hover:bg-cta-pressed' : 'border border-border-strong hover:bg-surface-sunken',
                    )}
                  >
                    Talk to us about {plan.name}
                  </button>
                </Reveal>
              ))}
            </Container>
          </section>

          <section className="border-t border-border bg-surface py-20 sm:py-28" aria-labelledby="pricing-faq">
            <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <Eyebrow>Questions</Eyebrow>
                <h2 id="pricing-faq" className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">About pricing.</h2>
              </div>
              <Faq items={pricingFaqs} />
            </Container>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}
