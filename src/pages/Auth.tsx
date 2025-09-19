import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plane, Chrome } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Surface OAuth errors returned via query or hash
  useEffect(() => {
    const showError = (msg: string) => {
      toast({
        title: "Google Sign-in Error",
        description: msg,
        variant: "destructive",
      });
    };

    // Check query params
    const search = new URLSearchParams(window.location.search);
    const qErr = search.get('error_description') || search.get('error');

    // Check hash params (#)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hErr = hash.get('error_description') || hash.get('error');

    const err = qErr || hErr;
    if (err) {
      showError(decodeURIComponent(err));
      // Clean the URL to avoid repeated toasts
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate password confirmation
        if (password !== confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "Passwords do not match. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Validate password strength
        if (password.length < 6) {
          toast({
            title: "Weak password",
            description: "Password must be at least 6 characters long.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else if (error.message.includes('User already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Account created successfully!",
            description: "Please check your email and click the confirmation link to activate your account."
          });
          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive"
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email not confirmed",
              description: "Please check your email and click the confirmation link before signing in.",
              variant: "destructive"
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in."
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google Sign-in Error",
          description: error.message || "Failed to sign in with Google. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Travel Planner
          </h1>
          <p className="text-muted-foreground mt-2">
            Plan your perfect journey with AI assistance
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Sign up to start planning your travels'
                : 'Sign in to continue your journey'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-11 font-medium"
              type="button"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;