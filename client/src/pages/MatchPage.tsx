import { useState, useCallback, useMemo } from 'react';
import { AlertCircle, Hourglass, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMatch } from '@/hooks/useMatch';
import { RevealAnimation } from '@/components/match/RevealAnimation';
import { MatchCard } from '@/components/match/MatchCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';
import { characters } from '@/assets/characters';
import { DeleteAccountDialog } from '@/components/auth/DeleteAccountDialog';

type PageState = 'loading' | 'reveal' | 'card' | 'error' | 'no-match';

export function MatchPage() {
  const { language } = useAuth();
  const { match, loading, error, refetch } = useMatch();
  const [revealCompleted, setRevealCompleted] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // Derive page state from data instead of using effect
  const pageState = useMemo((): PageState => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!match || !match.recipient) return 'no-match';
    if (match.firstTime && !revealCompleted) return 'reveal';
    return 'card';
  }, [loading, error, match, revealCompleted]);

  const showAnimation = match?.firstTime && !revealCompleted;

  const handleRevealComplete = useCallback(() => {
    setRevealCompleted(true);
  }, []);

  return (
    <PageContainer>
      <div className="min-h-[60vh] flex items-center justify-center">
        {pageState === 'loading' && (
          <LoadingSpinner message={translate(language, 'Loading your match...')} className="py-20" />
        )}

        {pageState === 'error' && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{translate(language, 'Unable to load your match')}</AlertTitle>
            <AlertDescription className="mt-2">
              {error || translate(language, 'An unexpected error occurred')}
            </AlertDescription>
            <Button
              variant="outline"
              onClick={refetch}
              className="mt-4"
            >
              {translate(language, 'Try Again')}
            </Button>
          </Alert>
        )}

        {pageState === 'no-match' && (
          <section className="mx-4 max-w-lg rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="relative mx-auto mb-5 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-red-50 to-emerald-100">
              <img src={characters.santa} alt="" className="h-32 w-32 object-contain" />
              <div className="absolute -right-1 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                <Hourglass className="h-7 w-7 animate-pulse text-amber-600" aria-hidden="true" />
              </div>
            </div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-[#1a472a]">
              {translate(language, 'The draw has not happened yet')}
            </h2>
            <p className="text-gray-600">
              {translate(language, 'Santa is getting everything ready. Please be patient; your match will appear here as soon as the draw is complete.')}
            </p>
          </section>
        )}

        {pageState === 'reveal' && match?.recipient && (
          <div className="w-full max-w-lg">
            <RevealAnimation
              recipientName={match.recipient.name}
              onComplete={handleRevealComplete}
            />
          </div>
        )}

        {pageState === 'card' && match?.recipient && (
          <MatchCard
            recipient={match.recipient}
            animated={showAnimation}
          />
        )}
      </div>
      <div className="mx-auto mt-10 w-full max-w-3xl border-t border-white/20 pt-6">
        <Button
          variant="ghost"
          className="text-red-200 hover:bg-red-950/30 hover:text-white"
          onClick={() => setDeleteAccountDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {translate(language, 'Delete my account')}
        </Button>
      </div>
      <DeleteAccountDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      />
    </PageContainer>
  );
}
