import { Suspense } from 'react';
import { Auth } from '../custom/Auth';
import styles from '../../styles/Home.module.css';

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<div>Loading...</div>}>
        <Auth />
      </Suspense>
    </main>
  );
}
