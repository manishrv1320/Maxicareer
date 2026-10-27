import React, { useEffect, useState } from 'react';
import { Button, Field, Input, Modal } from '../admin/ui';
import { FormError, useAsyncAction } from './kit';
import { auth } from '../../lib/api';

/**
 * Asks for a new password while the account still has the one-time password the Maxicareer
 * team emailed (a new account or a reset). Used by the student portal and the workspace;
 * the admin portal has its own.
 */
export const ChangePasswordGate: React.FC<{ onDone: (message: string) => void }> = ({ onDone }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const { busy, error, setError, run } = useAsyncAction();

  useEffect(() => {
    auth
      .me()
      .then((res) => setOpen(Boolean(res.user?.mustChangePassword)))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8) return setError('Use at least 8 characters.');
    if (form.next !== form.confirm) return setError("The new passwords don't match.");
    if (form.next === form.current) return setError('Choose a password that is different from the one-time password.');
    if (await run(() => auth.changePassword(form.current, form.next))) {
      setOpen(false);
      setForm({ current: '', next: '', confirm: '' });
      onDone('Password updated. Use it the next time you sign in.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title="Choose your own password"
      description="You're using a one-time password from the Maxicareer team. Set your own to continue."
      width="max-w-md"
      footer={
        <Button variant="primary" type="submit" form="ws-change-pw" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      }
    >
      <form id="ws-change-pw" onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="One-time password" hint="It's in the email we sent you.">
          <Input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <Input type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
};
