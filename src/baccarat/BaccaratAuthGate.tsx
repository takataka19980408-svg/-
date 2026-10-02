import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from './firebase';
import { startStoreSync, isStoreReady, subscribeToStore, checkAndRunDailyBackup } from './storage';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from './theme';

function LoadingScreen() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#07100C', color: SUB, fontFamily: BRUSH, fontSize: 13,
    }}>
      読み込み中…
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('メールアドレスまたはパスワードが違います');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#07100C', padding: 20, boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: GOLD, fontFamily: BRUSH, marginBottom: 28, letterSpacing: '0.15em' }}>
        バカラ卓 運用記録
      </div>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320 }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="メールアドレス" autoComplete="username" required
          style={{
            width: '100%', padding: '13px 14px', marginBottom: 10,
            background: CARD, border: `1px solid ${BDR}`, borderRadius: 8,
            fontSize: 15, color: TEXT, fontFamily: BRUSH, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="パスワード" autoComplete="current-password" required
          style={{
            width: '100%', padding: '13px 14px', marginBottom: 14,
            background: CARD, border: `1px solid ${BDR}`, borderRadius: 8,
            fontSize: 15, color: TEXT, fontFamily: BRUSH, outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ color: REDB, fontSize: 12, fontFamily: BRUSH, marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: BRUSH,
            background: `${GOLD}18`, border: `1px solid ${GOLD}`, color: GOLDB,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}

export function BaccaratAuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) startStoreSync();
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeToStore(() => {
      forceUpdate(n => n + 1);
      void checkAndRunDailyBackup();
    });
  }, [user]);

  if (user === undefined) return <LoadingScreen />;
  if (user === null) return <LoginForm />;
  if (!isStoreReady()) return <LoadingScreen />;
  return <>{children}</>;
}
