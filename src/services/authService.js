// 로그인 서비스 — Firebase Authentication과 실제로 연결된다. (계약서 2절 '로그인')
// 화면은 이 파일의 함수만 부르고 Firebase를 직접 부르지 않는다.
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { createError } from './errors.js';
import { setCurrentUid } from './session.js';

// Firebase 사용자 객체를 계약서 모양 { uid, email } 로 바꾼다.
function toUser(firebaseUser) {
  return { uid: firebaseUser.uid, email: firebaseUser.email };
}

// Firebase 에러 코드를 계약서 에러 코드로 바꾼다.
// context: 'signUp' 이면 가입 규칙, 'signIn' 이면 로그인 규칙으로 해석한다.
export function toContractError(error, context) {
  const code = error?.code ?? '';

  if (context === 'signUp') {
    if (code === 'auth/email-already-in-use') return createError('EMAIL_IN_USE');
    if (code === 'auth/weak-password' || code === 'auth/missing-password') {
      return createError('WEAK_PASSWORD');
    }
    if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
      return createError('INVALID_EMAIL');
    }
  }

  if (context === 'signIn') {
    const loginFailures = [
      'auth/invalid-credential',
      'auth/invalid-login-credentials',
      'auth/wrong-password',
      'auth/user-not-found',
      'auth/invalid-email',
      'auth/missing-email',
      'auth/missing-password',
      'auth/user-disabled',
    ];
    if (loginFailures.includes(code)) return createError('AUTH_FAILED');
  }

  // 네트워크 오류, 요청 과다 등 나머지는 저장(요청) 실패로 안내한다.
  return createError('SAVE_FAILED');
}

export async function signUp(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    setCurrentUid(result.user.uid);
    return toUser(result.user);
  } catch (error) {
    throw toContractError(error, 'signUp');
  }
}

export async function signIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setCurrentUid(result.user.uid);
    return toUser(result.user);
  } catch (error) {
    throw toContractError(error, 'signIn');
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    setCurrentUid(null);
  } catch (error) {
    throw toContractError(error, 'signOut');
  }
}

// 로그인 상태가 바뀔 때마다 callback({ uid, email }) 또는 callback(null)을 실행한다.
// 돌려받은 함수를 부르면 구독이 해제된다.
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    setCurrentUid(firebaseUser ? firebaseUser.uid : null);
    callback(firebaseUser ? toUser(firebaseUser) : null);
  });
}
