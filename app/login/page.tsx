import { loginAction } from './actions'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: 32,
          borderRadius: 24,
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            HANAN Savings
          </p>

          <h1 style={{ marginTop: 8, marginBottom: 8 }}>
            Welcome back 👋
          </h1>

          <p style={{ margin: 0, color: '#6b7280' }}>
            Masukkan PIN untuk melanjutkan.
          </p>
        </div>

        <form action={loginAction}>
          <label
            htmlFor="pin"
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            PIN
          </label>

          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="Masukkan PIN"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #d1d5db',
              fontSize: 16,
            }}
          />

          {params.error === 'invalid' && (
            <p style={{ color: '#dc2626', fontSize: 14 }}>
              PIN salah. Coba lagi.
            </p>
          )}

          {params.error === 'empty' && (
            <p style={{ color: '#dc2626', fontSize: 14 }}>
              PIN belum diisi.
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Masuk
          </button>
        </form>
      </div>
    </main>
  )
}