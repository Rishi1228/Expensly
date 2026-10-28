import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import AuthCard from '../components/AuthCard.jsx';
import Button from '../components/ui/Button.jsx';
import Field, { inputClass } from '../components/ui/Field.jsx';

const schema = z.object({ email: z.email('Enter a valid email') });

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('');
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    setFormError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return setFormError(error.message);
    setSentTo(email); // shown even if no account exists, so emails can't be probed
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We’ll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">
          Back to sign in
        </Link>
      }
    >
      {sentTo ? (
        <div className="text-center" role="status">
          <MailCheck className="mx-auto mb-3 size-10 text-emerald-500" aria-hidden />
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-sm text-slate-500">
            If an account exists for <span className="font-medium">{sentTo}</span>, a reset link is
            on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register('email')}
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
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
