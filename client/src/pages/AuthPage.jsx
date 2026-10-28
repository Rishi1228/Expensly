import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import Button from '../components/ui/Button.jsx';
import Field, { inputClass } from '../components/ui/Field.jsx';

const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE === 'true';

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

const signupSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const [formError, setFormError] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(isSignup ? signupSchema : loginSchema) });

  const onSubmit = async (v) => {
    setFormError('');
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: { data: { full_name: v.full_name }, emailRedirectTo: window.location.origin },
      });
      if (error) return setFormError(error.message);
      // No session means Supabase wants the email confirmed first.
      if (!data.session) setConfirmEmail(v.email);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: v.email,
        password: v.password,
      });
      if (error) setFormError(error.message);
    }
    // On success the auth listener updates the session and the route guard redirects.
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setFormError(error.message);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSignup
              ? 'Start tracking where your money goes.'
              : 'Sign in to your expense tracker.'}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {confirmEmail ? (
            <div className="text-center" role="status">
              <MailCheck className="mx-auto mb-3 size-10 text-emerald-500" aria-hidden />
              <p className="font-medium">Check your inbox</p>
              <p className="mt-1 text-sm text-slate-500">
                We sent a confirmation link to <span className="font-medium">{confirmEmail}</span>.
                Open it, then sign in.
              </p>
              <Link to="/login" className="mt-5 inline-block text-sm font-medium text-indigo-600">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {isSignup && (
                  <Field label="Name" htmlFor="full_name" error={errors.full_name?.message}>
                    <input
                      id="full_name"
                      autoComplete="name"
                      className={inputClass}
                      {...register('full_name')}
                    />
                  </Field>
                )}
                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    {...register('email')}
                  />
                </Field>
                <Field label="Password" htmlFor="password" error={errors.password?.message}>
                  <input
                    id="password"
                    type="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className={inputClass}
                    {...register('password')}
                  />
                </Field>

                {formError && (
                  <p
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  {isSignup ? 'Create account' : 'Sign in'}
                </Button>
              </form>

              {GOOGLE_ENABLED && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={signInWithGoogle}
                  >
                    Continue with Google
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {!confirmEmail && (
          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account? ' : 'New here? '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-medium text-indigo-600">
              {isSignup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
