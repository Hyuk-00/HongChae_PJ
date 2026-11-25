import { useState } from 'react'
import './AuthPage.css'

// 로그인 / 회원가입 화면에 들어갈 글자들
const MODES = {
  login: {
    title: '다시 만나서 반가워요',
    subtitle: '이메일로 로그인하고 이번 달 지출을 확인해 보세요.',
    submit: '로그인',
    loading: '로그인 중...',
    switchText: '아직 계정이 없나요?',
    switchAction: '회원가입',
  },
  signup: {
    title: '계정 만들기',
    subtitle: '이메일만 있으면 바로 시작할 수 있어요.',
    submit: '가입하기',
    loading: '가입 중...',
    switchText: '이미 계정이 있나요?',
    switchAction: '로그인',
  },
}

/**
 * 로그인 / 회원가입 화면
 * - onLogin(email, password), onSignUp(email, password)를 props로 받는다.
 * - 실패하면 계약서 3장 모양의 에러({ code, message })를 받아 message를 그대로 보여준다.
 * - Firebase를 직접 부르지 않는다. (계약서 규칙)
 */
export default function AuthPage({ onLogin, onSignUp }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const text = MODES[mode]
  const isSignup = mode === 'signup'
  const passwordMismatch =
    isSignup && passwordConfirm !== '' && password !== passwordConfirm

  // 빈 칸이 있거나, 비밀번호 확인이 다르거나, 처리 중이면 버튼을 막는다
  const canSubmit =
    email.trim() !== '' &&
    password !== '' &&
    (!isSignup || (passwordConfirm !== '' && !passwordMismatch)) &&
    !loading

  function switchMode() {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setPassword('')
    setPasswordConfirm('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await onSignUp(email.trim(), password)
      } else {
        await onLogin(email.trim(), password)
      }
    } catch (err) {
      setError(err?.message ?? '알 수 없는 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-window">
        {/* 왼쪽: 서비스 소개 */}
        <section className="auth-brand">
          <div className="brand-logo">
            <span className="brand-mark">₩</span>
            가계부
          </div>

          <h2 className="brand-headline">
            돈의 흐름을
            <br />
            한눈에.
          </h2>
          <p className="brand-desc">
            수입과 지출을 기록하고,
            <br />
            카테고리별 예산을 관리해 보세요.
          </p>

          <div className="preview-card" aria-hidden="true">
            <div className="preview-row">
              <span>이번 달 수입</span>
              <strong className="amount-income">+ 1,250,000원</strong>
            </div>
            <div className="preview-bar">
              <span style={{ width: '72%' }} />
            </div>
            <div className="preview-row">
              <span>이번 달 지출</span>
              <strong className="amount-expense">- 486,000원</strong>
            </div>
            <div className="preview-bar is-expense">
              <span style={{ width: '38%' }} />
            </div>
          </div>

          <div className="preview-chips" aria-hidden="true">
            <span>🍜 식비</span>
            <span>🚌 교통</span>
            <span>🛍️ 쇼핑</span>
            <span>🎬 문화·여가</span>
          </div>
        </section>

        {/* 오른쪽: 입력 폼 */}
        <section className="auth-form-area">
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <h1>{text.title}</h1>
            <p className="auth-subtitle">{text.subtitle}</p>

            <label className="field">
              <span>이메일</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="field">
              <span>비밀번호</span>
              <input
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? '6자 이상' : '비밀번호'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>

            {isSignup && (
              <label className="field">
                <span>비밀번호 확인</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 한 번 더 입력"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={loading}
                  aria-invalid={passwordMismatch}
                />
                {passwordMismatch && (
                  <small className="field-error">비밀번호가 서로 달라요.</small>
                )}
              </label>
            )}

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {loading ? text.loading : text.submit}
            </button>

            <p className="auth-switch">
              {text.switchText}
              <button type="button" onClick={switchMode} disabled={loading}>
                {text.switchAction}
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
