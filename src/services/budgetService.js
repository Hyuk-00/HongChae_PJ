// 예산 서비스 (mock) — 한 달·한 카테고리의 예산과 사용 현황. (계약서 2절 '집계·예산')
import { listOwnTransactions } from './transactionService.js';
import { requireUid } from './session.js';
import { assertMonth, validateBudget } from './validators.js';

let budgets = [];
let nextId = 1;

export async function setBudget({ month, category, limit }) {
  const uid = requireUid();
  validateBudget({ month, category, limit });

  // 같은 달·같은 카테고리의 예산이 이미 있으면 한도만 바꾼다.
  const existing = budgets.find(
    (b) => b.ownerId === uid && b.month === month && b.category === category,
  );
  if (existing) {
    existing.limit = limit;
    return { ...existing };
  }
  const budget = { id: `b${nextId++}`, ownerId: uid, month, category, limit };
  budgets.push(budget);
  return { ...budget };
}

export async function getBudgetStatus(month) {
  const uid = requireUid();
  assertMonth(month);

  const spentByCategory = new Map();
  for (const t of listOwnTransactions({ from: `${month}-01`, to: `${month}-31` })) {
    if (t.type !== 'expense') continue;
    spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + t.amount);
  }

  return budgets
    .filter((b) => b.ownerId === uid && b.month === month)
    .map((b) => {
      const spent = spentByCategory.get(b.category) ?? 0;
      return {
        category: b.category,
        limit: b.limit,
        spent,
        rate: Math.round((spent / b.limit) * 1000) / 10, // 소수점 첫째 자리까지
        over: spent > b.limit,
      };
    });
}

// 테스트에서 상태를 비울 때만 쓴다. 화면에서는 부르지 않는다.
export function __resetBudgetsForTest() {
  budgets = [];
  nextId = 1;
}
