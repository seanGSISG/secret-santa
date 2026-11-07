import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TreePine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { EventMilestones } from '@/components/layout/EventMilestones';
import { SpendingLimit } from '@/components/layout/SpendingLimit';
import { translate } from '@/lib/i18n';

export function RegistrationPage() {
  const navigate = useNavigate();
  const { config, language, setLanguage } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [secondhandPreference, setSecondhandPreference] = useState(true);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register', {
        name,
        email,
        language,
        secondhandPreference,
      });
      await setLanguage(language);
      navigate('/inscription/merci', {
        replace: true,
        state: { secondhandPreference },
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : translate(language, 'An unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,#c41e3a_0%,#8b1538_48%,#4a0d20_100%)] px-6 py-12">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#f8b229]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <section className="space-y-6 text-white">
          <div className="flex items-center gap-3 text-[#f8b229]">
            <Sparkles className="h-6 w-6" />
            <span className="font-serif text-xl">{config.gameTitle}</span>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
            {translate(language, 'Join the Secret Santa')}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/85">
            {config.welcomeMessage[language]}
          </p>
          {config.milestones.length > 0 && (
            <div className="rounded-2xl border border-white/20 bg-black/10 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold">{translate(language, 'Important dates')}</h2>
              <EventMilestones />
            </div>
          )}
        </section>

        <Card className="w-full border-0 bg-white/95 shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-[#f8b229] via-white to-[#f8b229]" />
          <CardHeader className="space-y-2 pt-8 text-center">
            <TreePine className="mx-auto h-8 w-8 text-[#8b1538]" />
            <CardTitle className="font-serif text-3xl text-[#8b1538]">
              {translate(language, 'Create my account')}
            </CardTitle>
            <CardDescription>
              {translate(language, 'We will email you a password. If you already have an account, its password will be reset.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
              {config.registrationRules[language].trim() && (
                <section className="mb-6 rounded-lg border border-[#8b1538]/20 bg-[#8b1538]/5 p-4">
                  <h2 className="mb-2 font-semibold text-[#8b1538]">
                    {translate(language, 'Registration rules')}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                    {config.registrationRules[language]}
                  </p>
                </section>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{translate(language, 'Name')}</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{translate(language, 'Email address')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{translate(language, 'Language')}</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(event) => void setLanguage(event.target.value === 'en' ? 'en' : 'fr')}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className={`flex items-start gap-3 rounded-xl border-2 p-4 shadow-md transition-colors ${
                secondhandPreference
                  ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 shadow-emerald-900/10 ring-2 ring-amber-300/60'
                  : 'border-red-500 bg-gradient-to-r from-red-100 via-rose-50 to-red-100 shadow-red-900/10 ring-2 ring-red-300/60'
              }`}>
                <span aria-hidden="true" className="text-2xl leading-none">🎁</span>
                <input
                  type="checkbox"
                  id="secondhandPreference"
                  checked={secondhandPreference}
                  onChange={(event) => setSecondhandPreference(event.target.checked)}
                  disabled={loading}
                  className={`mt-1 h-5 w-5 shrink-0 ${secondhandPreference ? 'accent-emerald-700' : 'accent-red-700'}`}
                />
                <Label
                  htmlFor="secondhandPreference"
                  className={`cursor-pointer text-sm font-medium leading-relaxed ${
                    secondhandPreference ? 'text-emerald-950' : 'text-red-950'
                  }`}
                >
                  {translate(language, secondhandPreference
                    ? 'Anti-consumerism: I will make and would like to receive a second-hand, upcycled, or handmade gift.'
                    : 'I would like to receive and will give a new gift within the spending limit.')}
                  <span aria-hidden="true" className="ml-2">{secondhandPreference ? '♻️' : '🛍️'}</span>
                </Label>
              </div>
              <SpendingLimit className="justify-end text-[#8b1538]" />
              <Button type="submit" className="w-full bg-[#8b1538] hover:bg-[#6d102c]" disabled={loading}>
                {loading
                  ? translate(language, 'Sending your password...')
                  : translate(language, 'Create my account')}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              {translate(language, 'Already have an account?')}{' '}
              <Link to="/connexion" className="font-medium text-[#8b1538] hover:underline">
                {translate(language, 'Sign in')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
