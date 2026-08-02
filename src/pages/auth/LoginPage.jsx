import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { Brand, Field } from '../../components/ui/index.js';

export function LoginPage({ t, error, onLogin }) {
  const [email, setEmail] = useState('owner@kharcha.local');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ email, password });
  }

  return (
    <div className="authPage">
      <form className="authCard" onSubmit={submit}>
        <Brand t={t} auth />
        <div className="authIntro">
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginSub')}</p>
        </div>
        <Field label={t('email')}>
          <input type="email" value={email} autoComplete="username" required onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label={t('password')}>
          <input type="password" value={password} autoComplete="current-password" required minLength={8} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        {error && <p className="authError">{error}</p>}
        <button className="primaryBtn full iconBtn">
          <IndianRupee aria-hidden="true" />
          {t('login')}
        </button>
      </form>
    </div>
  );
}
