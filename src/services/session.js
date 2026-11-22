// 지금 로그인한 사용자의 uid를 서비스들이 함께 쓰기 위한 작은 저장소.
// authService가 로그인 상태가 바뀔 때마다 값을 넣고, 다른 서비스는 읽기만 한다.
import { createError } from './errors.js';

let currentUid = null;

export function setCurrentUid(uid) {
  currentUid = uid ?? null;
}

export function getCurrentUid() {
  return currentUid;
}

// 로그인하지 않았으면 NOT_LOGGED_IN 에러를 던지고, 했으면 uid를 돌려준다.
export function requireUid() {
  if (!currentUid) throw createError('NOT_LOGGED_IN');
  return currentUid;
}
