import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase.js';
import Button from './ui/Button.jsx';
import Field, { inputClass } from './ui/Field.jsx';

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords don’t match', path: ['confirm'] });

/** Sets a new password for the signed-in user (reset link or Profile). */
export default function PasswordForm({ submitLabel = 'Save password', onDone }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError('password', { message: error.message });
    toast.success('Password updated');
    reset();
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="New password" htmlFor="new-password" error={errors.password?.message}>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register('password')}
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="confirm-password"
        error={errors.confirm?.message}
      >
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register('confirm')}
        />
      </Field>
      <Button type="submit" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
