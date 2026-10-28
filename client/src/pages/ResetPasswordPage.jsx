import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import AuthCard from '../components/AuthCard.jsx';
import PasswordForm from '../components/PasswordForm.jsx';
import { FullPageSpinner } from '../components/ui/Spinner.jsx';

/** Opened from the reset email: the link signs the user in, then they pick a new password. */
export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return (
      <AuthCard
        title="Link expired"
        subtitle="This reset link is invalid or has already been used."
      >
        <Link
          to="/forgot-password"
          className="block text-center text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          Send a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle={user.email}>
      <PasswordForm
        submitLabel="Save and continue"
        onDone={() => navigate('/', { replace: true })}
      />
    </AuthCard>
  );
}
