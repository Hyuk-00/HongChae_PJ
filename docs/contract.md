# 서비스 계약서 (A 화면 ↔ B 데이터·규칙)

> 화면(A)은 이 문서에 적힌 함수만 사용하고, Firebase를 직접 부르지 않는다.
> 데이터·규칙(B)은 이 문서대로 동작하는 함수를 만든다.
> 내용을 바꿀 때는 두 사람이 합의하고 PR로 이 파일을 먼저 수정한다.

---

## 1. 데이터 모양

### 거래 (Transaction) — 수입 또는 지출 1건

| 필드 | 타입 | 예시 | 규칙 |
|---|---|---|---|
| id | 문자열 | `"a1b2c3"` | 저장할 때 자동 생성 (화면에서 만들지 않음) |
| ownerId | 문자열 | `"uid123"` | 로그인한 사용자 UID, B가 자동으로 넣음 |
| type | 문자열 | `"expense"` | `"income"`(수입) 또는 `"expense"`(지출)만 가능 |
| amount | 숫자(정수) | `3000` | 1 이상 10,000,000 이하, 원 단위 정수 |
| category | 문자열 | `"food"` | 아래 카테고리 목록 중 하나 |
| date | 문자열 | `"2026-11-11"` | `YYYY-MM-DD` 형식, 오늘 이후 날짜 불가 |
| memo | 문자열 | `"떡볶이"` | 선택, 최대 30자 |
| createdAt | 날짜 | (자동) | 저장 시각, B가 자동으로 넣음 |

### 카테고리 목록

| 구분 | 값 | 화면 표시 |
|---|---|---|
| 지출 | `food` | 식비 |
| 지출 | `transport` | 교통 |
| 지출 | `shopping` | 쇼핑 |
| 지출 | `culture` | 문화·여가 |
| 지출 | `etc` | 기타 |
| 수입 | `allowance` | 용돈 |
| 수입 | `salary` | 월급 |
| 수입 | `etc_income` | 기타 수입 |

### 예산 (Budget) — 한 달, 한 카테고리의 예산

| 필드 | 타입 | 예시 | 규칙 |
|---|---|---|---|
| id | 문자열 | (자동) | |
| ownerId | 문자열 | `"uid123"` | B가 자동으로 넣음 |
| month | 문자열 | `"2026-11"` | `YYYY-MM` 형식 |
| category | 문자열 | `"food"` | 지출 카테고리만 가능 |
| limit | 숫자(정수) | `150000` | 1 이상 |

---

## 2. 함수 목록 (A가 부르는 것)

### 로그인 — `services/authService.js`

| 함수 | 넣는 값 | 돌려받는 값 |
|---|---|---|
| `signUp(email, password)` | 이메일, 비밀번호 | 사용자 `{ uid, email }` |
| `signIn(email, password)` | 이메일, 비밀번호 | 사용자 `{ uid, email }` |
| `signOut()` | 없음 | 없음 |
| `onAuthChange(callback)` | 로그인 상태가 바뀔 때 실행할 함수 | 구독 해제 함수 |

### 거래 — `services/transactionService.js`

| 함수 | 넣는 값 | 돌려받는 값 |
|---|---|---|
| `addTransaction(data)` | `{ type, amount, category, date, memo }` | 저장된 거래 (id 포함) |
| `updateTransaction(id, changes)` | 거래 id, 바꿀 칸만 | 수정된 거래 |
| `deleteTransaction(id)` | 거래 id | 없음 |
| `subscribeTransactions({ from, to }, callback)` | 기간 `"2026-11-01"`~`"2026-11-30"`, 목록이 바뀔 때 실행할 함수 | 구독 해제 함수 |

### 집계·예산 — `services/summaryService.js`, `services/budgetService.js`

| 함수 | 넣는 값 | 돌려받는 값 |
|---|---|---|
| `getSummary({ from, to, groupBy })` | 기간, `"day"` / `"month"` / `"category"` | `{ income, expense, balance, items: [{ key, income, expense }] }` |
| `setBudget({ month, category, limit })` | 예산 정보 | 저장된 예산 |
| `getBudgetStatus(month)` | `"2026-11"` | `[{ category, limit, spent, rate, over }]` |

- `rate`: 사용률(%) = spent / limit × 100, 소수점 첫째 자리까지
- `over`: spent가 limit보다 크면 `true`

---

## 3. 에러 모양 (실패했을 때)

모든 함수는 실패하면 아래 모양의 에러를 던진다. 화면은 `message`를 그대로 보여주면 된다.

```js
{ code: 'INVALID_AMOUNT', message: '금액은 1원 이상 1,000만 원 이하로 입력해 주세요.' }
```

| code | 언제 | message (화면 표시) |
|---|---|---|
| `INVALID_AMOUNT` | 금액이 숫자가 아니거나 범위 밖 | 금액은 1원 이상 1,000만 원 이하로 입력해 주세요. |
| `INVALID_DATE` | 날짜 형식 오류 또는 미래 날짜 | 오늘/이전 날짜를 선택해 주세요. |
| `INVALID_CATEGORY` | 목록에 없는 카테고리 | 카테고리를 선택해 주세요. |
| `INVALID_TYPE` | 수입/지출이 아닌 값 | 수입 또는 지출을 선택해 주세요. |
| `MEMO_TOO_LONG` | 메모 30자 초과 | 메모는 30자 이하로 입력해 주세요. |
| `NOT_LOGGED_IN` | 로그인 안 한 상태에서 요청 | 로그인이 필요해요. |
| `PERMISSION_DENIED` | 다른 사람 데이터 접근 | 접근 권한이 없어요. |
| `NOT_FOUND` | 없는 거래 id | 해당 기록을 찾을 수 없어요. |
| `AUTH_FAILED` | 이메일·비밀번호 틀림 | 이메일 또는 비밀번호가 올바르지 않아요. |
| `SAVE_FAILED` | 네트워크 등 저장 실패 | 저장하지 못했어요. 잠시 후 다시 시도해 주세요. |
| `EMAIL_IN_USE` | 회원가입 시 이미 가입된 이메일 | 이미 가입된 이메일이에요. |
| `WEAK_PASSWORD` | 회원가입 시 비밀번호 6자 미만 | 비밀번호는 6자 이상 입력해 주세요. |
| `INVALID_EMAIL` | 이메일 형식 오류 | 이메일 형식이 올바르지 않아요. |
---

## 4. 변경 기록

| 날짜 | 바뀐 내용 | 합의 |
|---|---|---|
| 2026-11-11 | 최초 작성 | A, B |
| 2026-11-20 | 회원가입 에러 3종 추가 (EMAIL_IN_USE, WEAK_PASSWORD, INVALID_EMAIL) | A, B |