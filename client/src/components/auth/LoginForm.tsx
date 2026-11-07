import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { TreePine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translate } from '@/lib/i18n';

export function LoginForm() {
  const { login, language } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(translate(language, 'Please enter both email and password'));
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
    } catch {
      // Error toast is already shown by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{translate(language, 'Email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={translate(language, 'you@example.com')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{translate(language, 'Password')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={translate(language, 'Enter your password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          translate(language, 'Signing in...')
        ) : (
          <span className="flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            {translate(language, 'Sign In')}
          </span>
        )}
      </Button>
    </form>
  );
}
