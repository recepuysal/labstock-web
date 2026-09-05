import { AuthForm } from '@/components/auth-form';
import { kayitOl } from '../auth-actions';

export default function KayitSayfasi() {
  return <AuthForm mod="kayit" eylem={kayitOl} />;
}
