import { useState } from 'react';
import Button from './Button.jsx';

/**
 * Two-tap button for actions that are hard to undo: the first tap asks ("Remove?"), the second does it.
 * Moving focus away cancels.
 */
export default function ConfirmButton({
  onConfirm,
  confirmLabel,
  children,
  label,
  idleVariant = 'danger-soft',
  confirmVariant = 'danger',
  ...props
}) {
  const [asking, setAsking] = useState(false);
  return (
    <Button
      variant={asking ? confirmVariant : idleVariant}
      size="sm"
      {...props}
      onClick={() => {
        if (!asking) return setAsking(true);
        setAsking(false);
        onConfirm();
      }}
      onBlur={() => setAsking(false)}
      aria-label={asking ? `Confirm: ${label}` : label}
    >
      {asking ? confirmLabel : children}
    </Button>
  );
}
