import { Link, useLocation } from 'react-router-dom';
import { Gift, Leaf, MailCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { EventMilestones } from '@/components/layout/EventMilestones';
import { SpendingLimit } from '@/components/layout/SpendingLimit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface RegistrationLocationState {
  secondhandPreference?: boolean;
}

export function RegistrationSuccessPage() {
  const location = useLocation();
  const { config, language } = useAuth();
  const state = location.state as RegistrationLocationState | null;
  const secondhandPreference = typeof state?.secondhandPreference === 'boolean'
    ? state.secondhandPreference
    : null;
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,#c41e3a_0%,#8b1538_48%,#4a0d20_100%)] px-6 py-12">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#f8b229]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl flex-col justify-center gap-6">
        <div className="flex items-center justify-center gap-3 text-[#f8b229]">
          <Sparkles className="h-6 w-6" />
          <span className="font-serif text-xl">{config.gameTitle}</span>
        </div>

        <Card className="border-0 bg-white/95 shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-[#f8b229] via-white to-[#f8b229]" />
          <CardHeader className="space-y-3 pt-8 text-center">
            <MailCheck className="mx-auto h-12 w-12 text-[#1a472a]" />
            <CardTitle className="font-serif text-3xl text-[#8b1538]">
              {translate(language, 'Thank you for signing up!')}
            </CardTitle>
            <CardDescription className="mx-auto max-w-xl text-base leading-relaxed">
              {translate(language, 'Check your inbox, including your spam or junk folder, for your password.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {secondhandPreference !== null && (
              <section className={`flex items-start gap-4 rounded-xl border p-4 ${
                secondhandPreference
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-red-200 bg-red-50 text-red-950'
              }`}>
                {secondhandPreference
                  ? <Leaf aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                  : <ShoppingBag aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />}
                <div>
                  <h2 className="font-semibold">{translate(language, 'Your gift commitment')}</h2>
                  <p className="mt-1 text-sm leading-relaxed">
                    {translate(language, secondhandPreference
                      ? 'Prepare a second-hand, upcycled, or handmade gift.'
                      : 'Prepare a new gift within the spending limit.')}
                  </p>
                </div>
                <Gift aria-hidden="true" className="ml-auto hidden h-7 w-7 shrink-0 opacity-60 sm:block" />
              </section>
            )}

            <SpendingLimit className="justify-center rounded-xl border border-[#8b1538]/15 bg-[#8b1538]/5 p-4 text-[#8b1538]" />

            {config.milestones.length > 0 && (
              <section className="rounded-xl border border-[#1a472a]/15 bg-[#1a472a]/5 p-4">
                <h2 className="mb-4 font-semibold text-[#1a472a]">
                  {translate(language, 'Important dates')}
                </h2>
                <EventMilestones />
              </section>
            )}

            <div className="text-center">
              <Button asChild className="bg-[#8b1538] hover:bg-[#6d102c]">
                <Link to="/connexion">{translate(language, 'Continue to sign in')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
