// 거래 서비스 (mock) — 메모리 배열에 저장한다. 새로고침하면 사라진다.
// 함수 이름·넣는 값·돌려받는 값은 계약서와 같게 두었으므로,
// 나중에 이 파일 안쪽만 Firestore로 바꾸면 화면은 고칠 필요가 없다.
import { createError } from './errors.js';
import { requireUid } from './session.js';
import { assertAmount, assertCategory, assertDate, assertMemo, assertType, validateTransaction } from './validators.js';

let transactions = []; // 모든 사용자의 거래가 들어 있다 (ownerId로 구분)
let nextId = 1;
const listeners = new Set(); // { uid, from, to, callback }

function copyOf(transaction) {
  return { ...transaction, createdAt: new Date(transaction.createdAt) };
}

function inRange(transaction, from, to) {
  return (!from || transaction.date >= from) && (!to || transaction.date <= to);
}

// 본인 거래만, 날짜 최신순(같은 날은 늦게 만든 순)으로 돌려준다.
export function listOwnTransactions({ from, to } = {}) {
  const uid = requireUid();
  return transactions
    .filter((t) => t.ownerId === uid && inRange(t, from, to))
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
    .map(copyOf);
}

function notifyAll() {
  for (const listener of listeners) {
    listener.callback(
      transactions
        .filter((t) => t.ownerId === listener.uid && inRange(t, listener.from, listener.to))
        .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
        .map(copyOf),
    );
  }
}

export async function addTransaction(data) {
  const uid = requireUid();
  validateTransaction(data ?? {});
  const { type, amount, category, date, memo = '' } = data;
  const transaction = {
    id: `t${nextId++}`,
    ownerId: uid,
    type,
    amount,
    category,
    date,
    memo,
    createdAt: new Date(),
  };
  transactions.push(transaction);
  notifyAll();
  return copyOf(transaction);
}

export async function updateTransaction(id, changes) {
  const uid = requireUid();
  const found = transactions.find((t) => t.id === id);
  if (!found) throw createError('NOT_FOUND');
  if (found.ownerId !== uid) throw createError('PERMISSION_DENIED');

  // 바꿀 칸만 검사하되, type/category는 합친 결과로 짝이 맞는지 본다.
  const allowedKeys = ['type', 'amount', 'category', 'date', 'memo'];
  const safeChanges = Object.fromEntries(
    Object.entries(changes ?? {}).filter(([key]) => allowedKeys.includes(key)),
  );
  if ('type' in safeChanges) assertType(safeChanges.type);
  if ('amount' in safeChanges) assertAmount(safeChanges.amount);
  if ('date' in safeChanges) assertDate(safeChanges.date);
  if ('memo' in safeChanges) assertMemo(safeChanges.memo);
  assertCategory(safeChanges.category ?? found.category, safeChanges.type ?? found.type);

  Object.assign(found, safeChanges);
  notifyAll();
  return copyOf(found);
}

export async function deleteTransaction(id) {
  const uid = requireUid();
  const found = transactions.find((t) => t.id === id);
  if (!found) throw createError('NOT_FOUND');
  if (found.ownerId !== uid) throw createError('PERMISSION_DENIED');
  transactions = transactions.filter((t) => t.id !== id);
  notifyAll();
}

// 기간 { from, to } 의 거래 목록이 바뀔 때마다 callback(목록)을 실행한다.
// 구독하는 즉시 현재 목록으로 한 번 실행하고, 돌려받은 함수로 구독을 해제한다.
export function subscribeTransactions({ from, to } = {}, callback) {
  const uid = requireUid();
  const listener = { uid, from, to, callback };
  listeners.add(listener);
  callback(listOwnTransactions({ from, to }));
  return () => listeners.delete(listener);
}

// 테스트에서 상태를 비울 때만 쓴다. 화면에서는 부르지 않는다.
export function __resetTransactionsForTest() {
  transactions = [];
  nextId = 1;
  listeners.clear();
}
