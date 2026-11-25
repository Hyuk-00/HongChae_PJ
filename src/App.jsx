import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import { signIn, signUp, signOut, onAuthChange } from './services/authService'

export default function App() {
  // undefined: 아직 확인 중 / null: 로그인 안 함 / { uid, email }: 로그인함
  const [user, setUser] = useState(undefined)

  // 로그인 상태가 바뀔 때마다 user를 갱신한다. (새로고침해도 로그인 유지)
  useEffect(() => {
    const unsubscribe = onAuthChange(setUser)
    return unsubscribe // 화면이 사라질 때 구독 해제
  }, [])

  // Firebase가 로그인 상태를 확인하는 동안 (로그인 화면이 잠깐 깜빡이는 것 방지)
  if (user === undefined) {
    return <p style={{ padding: 40 }}>불러오는 중...</p>
  }

  // 로그인 안 한 상태 → 로그인 화면
  // 성공하면 onAuthChange가 알아서 user를 바꿔 준다.
  if (user === null) {
    return <AuthPage onLogin={signIn} onSignUp={signUp} />
  }

  // 로그인한 상태 → 임시 메인 화면 (나중에 거래 목록 화면으로 교체)
  return (
    <main style={{ padding: 40 }}>
      <h1>{user.email}님, 환영해요 👋</h1>
      <p>여기에 메인(거래 목록) 화면이 들어갈 예정이에요.</p>
      <button onClick={signOut}>로그아웃</button>
    </main>
  )
}