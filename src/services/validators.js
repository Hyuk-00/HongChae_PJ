// 계약서 1절의 데이터 규칙을 검사하는 함수 모음. (화면이 아니라 B가 책임진다)
import { createError } from './errors.js';

export const MAX_AMOUNT = 10_000_000;
export const MAX_MEMO_LENGTH = 30;

export const EXPENSE_CATEGORIES = ['food', 'transport', 'shopping', 'culture', 'etc'];
export const INCOME_CATEGORIES = ['allowance', 'salary', 'etc_income'];
export const TYPES = ['income', 'expense'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// 오늘 날짜를 사용자 컴퓨터의 시간대 기준 'YYYY-MM-DD'로 만든다.
export function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 실제로 있는 날짜인지 확인한다. (2026-02-31 같은 값 거절)
export function isRealDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function assertType(type) {
  if (!TYPES.includes(type)) throw createError('INVALID_TYPE');
}

export function assertAmount(amount) {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
    throw createError('INVALID_AMOUNT');
  }
}

export function assertCategory(category, type) {
  const allowed = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowed.includes(category)) throw createError('INVALID_CATEGORY');
}

export function assertDate(date, now = new Date()) {
  if (!isRealDate(date) || date > todayString(now)) throw createError('INVALID_DATE');
}

export function assertMemo(memo) {
  if (memo === undefined || memo === null) return;
  if (typeof memo !== 'string' || memo.length > MAX_MEMO_LENGTH) {
    throw createError('MEMO_TOO_LONG');
  }
}

// 거래 1건 전체를 검사한다. (type을 먼저 봐야 category를 검사할 수 있다)
export function validateTransaction({ type, amount, category, date, memo }) {
  assertType(type);
  assertAmount(amount);
  assertCategory(category, type);
  assertDate(date);
  assertMemo(memo);
}

export function assertMonth(month) {
  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
    throw createError('INVALID_DATE');
  }
}

// 예산은 지출 카테고리에만 만들 수 있다.
export function validateBudget({ month, category, limit }) {
  assertMonth(month);
  assertCategory(category, 'expense');
  if (!Number.isInteger(limit) || limit < 1) throw createError('INVALID_AMOUNT');
}
