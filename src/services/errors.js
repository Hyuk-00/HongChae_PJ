// 계약서(docs/contract.md) 3절의 에러 모양을 한 곳에서 만든다.
// 모든 서비스 함수는 실패하면 { code, message } 를 가진 에러를 던진다.

export const ERROR_MESSAGES = {
  INVALID_AMOUNT: '금액은 1원 이상 1,000만 원 이하로 입력해 주세요.',
  INVALID_DATE: '오늘/이전 날짜를 선택해 주세요.',
  INVALID_CATEGORY: '카테고리를 선택해 주세요.',
  INVALID_TYPE: '수입 또는 지출을 선택해 주세요.',
  MEMO_TOO_LONG: '메모는 30자 이하로 입력해 주세요.',
  NOT_LOGGED_IN: '로그인이 필요해요.',
  PERMISSION_DENIED: '접근 권한이 없어요.',
  NOT_FOUND: '해당 기록을 찾을 수 없어요.',
  AUTH_FAILED: '이메일 또는 비밀번호가 올바르지 않아요.',
  SAVE_FAILED: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  EMAIL_IN_USE: '이미 가입된 이메일이에요.',
  WEAK_PASSWORD: '비밀번호는 6자 이상 입력해 주세요.',
  INVALID_EMAIL: '이메일 형식이 올바르지 않아요.',
};

export class ServiceError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SAVE_FAILED);
    this.name = 'ServiceError';
    this.code = ERROR_MESSAGES[code] ? code : 'SAVE_FAILED';
  }
}

export function createError(code) {
  return new ServiceError(code);
}
