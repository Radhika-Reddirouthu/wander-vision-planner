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
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address.",
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
          setShowEmailConfirmation(true);
          setSignupEmail(email);
          toast({
            title: "Account created successfully!",
            description: "Please check your email and click the confirmation link to activate your account."
          });
          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
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
              description: "The email or password you entered is incorrect. Please check and try again.",
              variant: "destructive"
            });
          } else if (error.message.includes('Email not confirmed')) {
            setShowResendConfirmation(true);
            setResendEmail(email);
            toast({
              title: "Email not confirmed",
              description: "Please check your email and click the confirmation link, or use the resend option below.",
              variant: "destructive",
              duration: 8000,
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message || "Please check your credentials and try again.",
              variant: "destructive"
            });
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

  const handleResendConfirmation = async () => {
    if (!resendEmail) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Confirmation email sent!",
        description: "Please check your email for the new confirmation link.",
      });
      setShowResendConfirmation(false);
    } catch (error: any) {
      toast({
        title: "Resend Error",
        description: error.message || "Failed to resend confirmation email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
            Wander Vision
          </h1>
          <p className="text-muted-foreground mt-2">
            Plan your perfect journey with AI assistance
          </p>
        </div>

        {showEmailConfirmation ? (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-green-600">
                Check Your Email!
              </CardTitle>
              <CardDescription>
                We've sent a confirmation email to <strong>{signupEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Please check your email and click the confirmation link to activate your account. 
                  Once confirmed, you can sign in below.
                </p>
              </div>
              
              <Button
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Go to Sign In
              </Button>

              <div className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setResendEmail(signupEmail);
                    setShowResendConfirmation(true);
                    setShowEmailConfirmation(false);
                  }}
                  className="text-primary hover:underline"
                >
                  resend confirmation email
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
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

              {showResendConfirmation && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-3">
                    Need to resend the confirmation email for <strong>{resendEmail}</strong>?
                  </p>
                  <Button
                    onClick={handleResendConfirmation}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Sending...' : 'Resend Confirmation Email'}
                  </Button>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowResendConfirmation(false);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
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
        )}
      </div>
    </div>
  );
};

export default Auth;