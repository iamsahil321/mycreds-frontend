import { Brand } from '../../components/ui/index.js';

export function AuthShell({ t, message }) {
  return (
    <div className="authPage">
      <div className="authCard">
        <Brand t={t} auth />
        <p className="authMuted">{message}</p>
      </div>
    </div>
  );
}
