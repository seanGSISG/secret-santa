import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Gift, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, api } from '@/lib/api';

interface RegistrationResponse {
  message: string;
}

export function RegistrationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<RegistrationResponse>('/auth/register', { name, email });
      toast.success(response.message);
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb]">
      <div className="absolute top-10 right-10 text-[#1a472a]/10">
        <Gift className="w-16 h-16" />
      </div>
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#1a472a] via-[#8b1538] to-[#1a472a]" />
        <CardHeader className="space-y-2 pt-8 text-center">
          <TreePine className="mx-auto h-8 w-8 text-[#1a472a]" />
          <CardTitle className="text-3xl font-serif text-[#1a472a]">Create your account</CardTitle>
          <CardDescription>
            We’ll email you a password to sign in. Registering with an existing account will reset its password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="email">Email</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending password...' : 'Register'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#1a472a] hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
