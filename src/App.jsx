import { useState } from 'react'
import AuthPage from './pages/AuthPage'

// ------------------------------------------------------------------
// TODO(#3): B의 authService가 main에 합쳐지면 아래 "임시 로그인" 부분을 지우고
//   import { signIn, signUp, signOut, onAuthChange } from './services/authService'
// 로 바꿔서 연결한다.
// ------------------------------------------------------------------
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 임시 로그인: 비밀번호가 test1234면 성공, 아니면 계약서 모양의 에러
async function fakeSignIn(email, password) {
  await wait(700)
  if (password !== 'test1234') {
    throw {
      code: 'AUTH_FAILED',
      message: '이메일 또는 비밀번호가 올바르지 않아요.',
    }
  }
  return { uid: 'fake-uid', email }
}

// 임시 회원가입: 이메일 형식, 비밀번호 6자 이상 검사
async function fakeSignUp(email, password) {
  await wait(700)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { code: 'INVALID_EMAIL', message: '이메일 형식이 올바르지 않아요.' }
  }
  if (password.length < 6) {
    throw {
      code: 'WEAK_PASSWORD',
      message: '비밀번호는 6자 이상 입력해 주세요.',
    }
  }
  return { uid: 'fake-uid', email }
}

export default function App() {
  const [user, setUser] = useState(null)

  // 로그인 안 한 상태 → 로그인 화면만 보이기
  if (!user) {
    return (
      <AuthPage
        onLogin={async (email, password) =>
          setUser(await fakeSignIn(email, password))
        }
        onSignUp={async (email, password) =>
          setUser(await fakeSignUp(email, password))
        }
      />
    )
  }

  // 로그인한 상태 → 임시 메인 화면 (나중에 거래 목록 화면으로 교체)
  return (
    <main style={{ padding: 40 }}>
      <h1>{user.email}님, 환영해요 👋</h1>
      <p>여기에 메인(거래 목록) 화면이 들어갈 예정이에요.</p>
      <button onClick={() => setUser(null)}>로그아웃</button>
    </main>
  )
}
