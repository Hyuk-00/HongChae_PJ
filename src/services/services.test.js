// mock 서비스와 검증 규칙 테스트 (npm test). authService는 Firebase가 필요해서 제외했다.
import { beforeEach, describe, expect, it } from 'vitest';
import { setCurrentUid } from './session.js';
import { todayString } from './validators.js';
import {
  __resetTransactionsForTest,
  addTransaction,
  deleteTransaction,
  subscribeTransactions,
  updateTransaction,
} from './transactionService.js';
import { getSummary } from './summaryService.js';
import { __resetBudgetsForTest, getBudgetStatus, setBudget } from './budgetService.js';

const today = todayString();
const thisMonth = today.slice(0, 7);

// 실패할 것으로 예상되는 호출에서 에러 코드를 꺼낸다. (실패하지 않으면 'NO_ERROR')
async function codeOf(promise) {
  try {
    await promise;
    return 'NO_ERROR';
  } catch (error) {
    return error.code;
  }
}

const valid = { type: 'expense', amount: 3000, category: 'food', date: today, memo: '떡볶이' };

beforeEach(() => {
  __resetTransactionsForTest();
  __resetBudgetsForTest();
  setCurrentUid('userA');
});

describe('addTransaction 검증', () => {
  it('올바른 값은 id와 ownerId가 붙어 저장된다', async () => {
    const saved = await addTransaction(valid);
    expect(saved.ownerId).toBe('userA');
    expect(typeof saved.id).toBe('string');
  });

  it('금액이 범위 밖이거나 정수가 아니면 INVALID_AMOUNT', async () => {
    expect(await codeOf(addTransaction({ ...valid, amount: 0 }))).toBe('INVALID_AMOUNT');
    expect(await codeOf(addTransaction({ ...valid, amount: 10_000_001 }))).toBe('INVALID_AMOUNT');
    expect(await codeOf(addTransaction({ ...valid, amount: 10.5 }))).toBe('INVALID_AMOUNT');
    expect(await codeOf(addTransaction({ ...valid, amount: '3000' }))).toBe('INVALID_AMOUNT');
  });

  it('미래 날짜·형식 오류·없는 날짜는 INVALID_DATE', async () => {
    expect(await codeOf(addTransaction({ ...valid, date: '2999-01-01' }))).toBe('INVALID_DATE');
    expect(await codeOf(addTransaction({ ...valid, date: '2026/11/11' }))).toBe('INVALID_DATE');
    expect(await codeOf(addTransaction({ ...valid, date: '2026-02-31' }))).toBe('INVALID_DATE');
  });

  it('목록에 없거나 수입/지출과 안 맞는 카테고리는 INVALID_CATEGORY', async () => {
    expect(await codeOf(addTransaction({ ...valid, category: 'game' }))).toBe('INVALID_CATEGORY');
    expect(await codeOf(addTransaction({ ...valid, category: 'salary' }))).toBe('INVALID_CATEGORY');
  });

  it('type이 잘못되면 INVALID_TYPE, 메모가 31자면 MEMO_TOO_LONG', async () => {
    expect(await codeOf(addTransaction({ ...valid, type: 'gift' }))).toBe('INVALID_TYPE');
    expect(await codeOf(addTransaction({ ...valid, memo: 'a'.repeat(31) }))).toBe('MEMO_TOO_LONG');
  });

  it('로그인하지 않으면 NOT_LOGGED_IN', async () => {
    setCurrentUid(null);
    expect(await codeOf(addTransaction(valid))).toBe('NOT_LOGGED_IN');
  });
});

describe('수정·삭제와 접근 권한', () => {
  it('본인 거래는 수정·삭제할 수 있다', async () => {
    const saved = await addTransaction(valid);
    const updated = await updateTransaction(saved.id, { amount: 5000 });
    expect(updated.amount).toBe(5000);
    await deleteTransaction(saved.id);
    expect(await codeOf(deleteTransaction(saved.id))).toBe('NOT_FOUND');
  });

  it('다른 사람의 거래는 PERMISSION_DENIED이고 내용은 그대로다', async () => {
    const saved = await addTransaction(valid);
    setCurrentUid('userB');
    expect(await codeOf(updateTransaction(saved.id, { amount: 1 }))).toBe('PERMISSION_DENIED');
    expect(await codeOf(deleteTransaction(saved.id))).toBe('PERMISSION_DENIED');
    setCurrentUid('userA');
    let list = [];
    subscribeTransactions({}, (items) => (list = items))();
    expect(list[0].amount).toBe(3000);
  });

  it('수정할 때도 검증한다 (type만 바꿔 카테고리가 안 맞으면 거절)', async () => {
    const saved = await addTransaction(valid);
    expect(await codeOf(updateTransaction(saved.id, { type: 'income' }))).toBe('INVALID_CATEGORY');
    expect(await codeOf(updateTransaction(saved.id, { amount: -5 }))).toBe('INVALID_AMOUNT');
  });
});

describe('subscribeTransactions', () => {
  it('구독 즉시 현재 목록을 주고, 바뀔 때마다 다시 준다', async () => {
    const calls = [];
    const unsubscribe = subscribeTransactions({}, (items) => calls.push(items.length));
    await addTransaction(valid);
    await addTransaction(valid);
    expect(calls).toEqual([0, 1, 2]);
    unsubscribe();
    await addTransaction(valid);
    expect(calls).toEqual([0, 1, 2]);
  });

  it('본인 거래만 받는다', async () => {
    await addTransaction(valid);
    setCurrentUid('userB');
    let list = null;
    subscribeTransactions({}, (items) => (list = items))();
    expect(list.length).toBe(0);
  });
});

describe('getSummary / 예산', () => {
  it('수입·지출·잔액과 카테고리별 합계를 계산한다', async () => {
    await addTransaction({ ...valid, amount: 3000 });
    await addTransaction({ ...valid, amount: 2000, category: 'transport' });
    await addTransaction({ type: 'income', amount: 10000, category: 'allowance', date: today });
    const summary = await getSummary({ from: `${thisMonth}-01`, to: `${thisMonth}-31`, groupBy: 'category' });
    expect(summary.income).toBe(10000);
    expect(summary.expense).toBe(5000);
    expect(summary.balance).toBe(5000);
    expect(summary.items.length).toBe(3);
  });

  it('예산 사용률은 소수점 첫째 자리까지, 넘으면 over가 true', async () => {
    await setBudget({ month: thisMonth, category: 'food', limit: 7000 });
    await addTransaction({ ...valid, amount: 3000 });
    let status = await getBudgetStatus(thisMonth);
    expect(status).toEqual([{ category: 'food', limit: 7000, spent: 3000, rate: 42.9, over: false }]);
    await addTransaction({ ...valid, amount: 5000 });
    status = await getBudgetStatus(thisMonth);
    expect(status[0].over).toBe(true);
  });

  it('예산은 지출 카테고리에만 만들 수 있고 같은 달·카테고리는 덮어쓴다', async () => {
    expect(await codeOf(setBudget({ month: thisMonth, category: 'salary', limit: 1000 }))).toBe('INVALID_CATEGORY');
    await setBudget({ month: thisMonth, category: 'food', limit: 1000 });
    await setBudget({ month: thisMonth, category: 'food', limit: 2000 });
    expect((await getBudgetStatus(thisMonth)).length).toBe(1);
  });
});
