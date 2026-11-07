import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface WishlistFormProps {
  onAdd: (url: string) => Promise<void>;
}

export function WishlistForm({ onAdd }: WishlistFormProps) {
  const { language } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setError(translate(language, 'Please enter an Amazon URL'));
      return false;
    }

    try {
      const urlObj = new URL(value);
      if (!urlObj.hostname.includes('amazon.com')) {
        setError(translate(language, 'Please enter a valid Amazon.com URL'));
        return false;
      }
      return true;
    } catch {
      setError(translate(language, 'Please enter a valid URL'));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateUrl(url)) {
      return;
    }

    setLoading(true);
    try {
      await onAdd(url);
      setUrl('');
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(translate(language, 'Failed to add item to wishlist'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#e5e0d8]">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">{translate(language, 'Add Wishlist Item')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amazon-url">{translate(language, 'Amazon Product URL')}</Label>
            <Input
              id="amazon-url"
              type="url"
              placeholder="https://www.amazon.com/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="border-gray-300 focus-visible:ring-[#1a472a]"
            />
            <p className="text-sm text-gray-500">
              {translate(language, "Paste the URL of any Amazon product you'd like to add to your wishlist")}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-[#1a472a] hover:bg-[#1a472a]/90 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {translate(language, 'Adding Item...')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {translate(language, 'Add to Wishlist')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
