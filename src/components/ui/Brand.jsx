import { IndianRupee } from 'lucide-react';

export function Brand({ t, auth = false }) {
  return (
    <div className={auth ? 'brand authBrand' : 'brand'}>
      <div className="brandIcon">
        <IndianRupee aria-hidden="true" />
      </div>
      <div>
        <h1>Kharcha</h1>
        <p>{t('appSubtitle')}</p>
      </div>
    </div>
  );
}
