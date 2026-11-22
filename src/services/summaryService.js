// 집계 서비스 (mock) — 본인 거래를 기간·묶음 기준으로 합친다.
import { listOwnTransactions } from './transactionService.js';
import { createError } from './errors.js';

const GROUP_KEYS = {
  day: (t) => t.date,
  month: (t) => t.date.slice(0, 7),
  category: (t) => t.category,
};

export async function getSummary({ from, to, groupBy = 'day' } = {}) {
  const keyOf = GROUP_KEYS[groupBy];
  if (!keyOf) throw createError('SAVE_FAILED');

  const grouped = new Map();
  let income = 0;
  let expense = 0;

  for (const t of listOwnTransactions({ from, to })) {
    const key = keyOf(t);
    const item = grouped.get(key) ?? { key, income: 0, expense: 0 };
    if (t.type === 'income') {
      item.income += t.amount;
      income += t.amount;
    } else {
      item.expense += t.amount;
      expense += t.amount;
    }
    grouped.set(key, item);
  }

  const items = [...grouped.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return { income, expense, balance: income - expense, items };
}
