# Interview: TypeScript Patterns & Type System

---

## Q1. Giải thích `ApiResponse<T>` generic type. Tại sao cần unwrap?

**Trả lời:**

NestJS `TransformInterceptor` wrap mọi response trong envelope:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* actual payload */ }
}
```

TypeScript interface:

```typescript
// lib/types/index.ts
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
```

**Generic `<T>` là gì:**

`T` là **type parameter** — placeholder cho type thực tế của `data`. Giống như function parameter nhưng cho type:

```typescript
// Khi gọi getTests():
apiClient.get<ApiResponse<PaginatedTests>>('/api/tests')
//                        ^^^^^^^^^^^^
//                        T được thay bằng PaginatedTests
// → response.data.data có type PaginatedTests

// Khi gọi getProfile():
apiClient.get<ApiResponse<UserProfile>>('/api/auth/profile')
// → response.data.data có type UserProfile
```

**Unwrap pattern trong lib/api/*.ts:**

```typescript
export const testApi = {
  getTests: (params?: QueryTestsParams): Promise<PaginatedTests> =>
    apiClient
      .get<ApiResponse<PaginatedTests>>('/api/tests', { params })
      .then(r => r.data.data),
      //    ^^^^^^^^^^^^
      // r: AxiosResponse<ApiResponse<PaginatedTests>>
      // r.data: ApiResponse<PaginatedTests>
      // r.data.data: PaginatedTests
};
```

TypeScript tự infer type cho mỗi bước → IDE biết kiểu chính xác → không cần cast.

---

## Q2. Giải thích `as const` trong query keys factory. Nó ảnh hưởng gì đến type inference?

**Trả lời:**

```typescript
// Không có 'as const':
const key = ['tests', 'list', { skill: 'reading' }];
// Type: (string | { skill: string })[]  ← wide type

// Với 'as const':
const key = ['tests', 'list', { skill: 'reading' }] as const;
// Type: readonly ['tests', 'list', { readonly skill: 'reading' }]  ← narrow, precise
```

**Tại sao narrow type quan trọng cho React Query:**

```typescript
export const queryKeys = {
  tests: {
    list: (params?: QueryTestsParams) =>
      ['tests', 'list', params] as const,
    //                           ^^^^^^^^
    // Without 'as const': (string | QueryTestsParams | undefined)[]
    // With 'as const': readonly ['tests', 'list', QueryTestsParams | undefined]
  },
};
```

React Query dùng key để:
1. **Cache lookup:** So sánh key arrays
2. **Invalidation:** Match prefix arrays

Với `readonly tuple` (từ `as const`), TypeScript đảm bảo:
- Không thể mutate key sau khi tạo
- Type của từng element được preserve (không bị widened thành `string`)

---

## Q3. Union types và type narrowing trong dự án. Ví dụ cụ thể.

**Trả lời:**

**Union types** cho phép một value có thể là nhiều types:

```typescript
type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
type GradingStatus = 'pending' | 'ai_graded' | 'human_reviewed';
type Action = 'start_part' | 'respond' | 'grade_part';
```

**Type narrowing** là quá trình TypeScript thu hẹp type dựa trên condition:

```typescript
// SpeakingPartConfig có cấu trúc khác nhau tùy partNumber:
interface SpeakingPartConfig {
  topics?: { topicName: string; questions: { questionText: string }[] }[];  // Part 1
  cues?: string[];           // Part 2
  prepTime?: number;         // Part 2
  questions?: { questionText: string }[];  // Part 3
}

// Trong component, dùng narrowing:
function renderPartConfig(partNumber: 1 | 2 | 3, config: SpeakingPartConfig) {
  if (partNumber === 1) {
    // TypeScript không tự narrow SpeakingPartConfig dựa trên partNumber
    // Nhưng ta biết topics chỉ có ở Part 1
    return config.topics?.map(topic => <TopicCard key={topic.topicName} {...topic} />);
  }
  if (partNumber === 2) {
    return <CueCard cues={config.cues ?? []} prepTime={config.prepTime} />;
  }
  // partNumber === 3 (TypeScript infers this)
  return config.questions?.map(q => <QuestionItem key={q.questionText} {...q} />);
}
```

**Discriminated union pattern (nên dùng):**

```typescript
// Thay vì optional fields, dùng discriminated union:
type SpeakingPartConfig =
  | { partNumber: 1; topics: { topicName: string; questions: string[] }[] }
  | { partNumber: 2; cues: string[]; prepTime: number; speakTime: number }
  | { partNumber: 3; questions: string[] };

// TypeScript tự narrow khi check partNumber:
function render(config: SpeakingPartConfig) {
  if (config.partNumber === 1) {
    config.topics; // ✅ TypeScript biết có 'topics'
  }
  if (config.partNumber === 2) {
    config.cues;   // ✅ TypeScript biết có 'cues'
  }
}
```

Dự án hiện tại dùng optional fields (dễ implement hơn) nhưng discriminated union là pattern tốt hơn.

---

## Q4. `Record<string, any>` trong `question.config`. Đây có phải TypeScript tốt không?

**Trả lời:**

```typescript
interface Question {
  config: Record<string, any>;  // ← JSONB, shape varies by questionType
}
```

`Record<string, any>` về bản chất là `{ [key: string]: any }` — cho phép bất kỳ key/value nào. Đây là **type không safe**, nhưng có lý do hợp lý:

**Tại sao `any` ở đây:**

`config` là JSONB PostgreSQL field có shape khác nhau tùy `questionType`:

```typescript
// multiple_choice:
{ options: ['A', 'B', 'C', 'D'] }

// fill_in_blank:
{ blanks: 3 }

// matching:
{ pairs: [{ left: 'Darwin', right: 'Evolution' }] }

// heading_matching:
{ headings: ['...'], paragraphs: ['...'] }
```

Nếu muốn type safe hoàn toàn:

```typescript
type QuestionConfig =
  | { type: 'multiple_choice'; options: string[] }
  | { type: 'fill_in_blank'; blanks: number }
  | { type: 'matching'; pairs: { left: string; right: string }[] }
  | { type: 'heading_matching'; headings: string[]; paragraphs: string[] }
  | { type: 'matching_features'; features: string[]; statements: string[] }
  | { type: 'sentence_ending'; sentence_starts: string[]; endings: string[] };

interface Question {
  questionType: QuestionConfig['type'];
  config: QuestionConfig;
}
```

Điều này yêu cầu `TestQuestionItem` component switch trên `questionType` và TypeScript sẽ narrow `config` type.

**Trade-off thực tế:**

Dự án có 6+ question types và config shapes có thể thay đổi khi thêm types mới. `Record<string, any>` cho flexibility nhưng mất type safety. Cho dự án tốt nghiệp với timeline ngắn, đây là trade-off có thể chấp nhận.

---

## Q5. Giải thích `DashboardSummary` interface phức tạp. Tại sao cần nhiều optional fields?

**Trả lời:**

```typescript
interface DashboardSummary {
  bandProfiles: LearnerBandProfile[];
  latestOverallBand: number | null;
  progressHistory: LearnerProgressSnapshot[];
  totalMistakes: number;
  mistakesByType: Record<string, number>;
  
  // Optional computed fields:
  totalAttempts?: number;
  averageBand?: number;
  practiceHours?: number;       // Derived: sum of attempt durations
  examReadiness?: number;       // (avgBand / 9) * 100
  
  questionTypeMastery?: {...}[];
  adaptiveStudyPlan?: {...}[];
  rubricBreakdown?: { writing: null | {...}; speaking: null | {...} };
}
```

**Tại sao `number | null` thay vì `number?`?**

`latestOverallBand: number | null` nghĩa là field **luôn có mặt trong response** nhưng giá trị có thể null (user chưa làm bài thi nào → không có band).

`latestOverallBand?: number` nghĩa là field có thể **không có trong object** — khác với null. TypeScript treat chúng khác nhau:

```typescript
// number | null: phải check null nhưng field luôn exists
if (summary.latestOverallBand !== null) {
  renderBand(summary.latestOverallBand); // TypeScript biết là number
}

// number | undefined: phải check undefined
if (summary.practiceHours !== undefined) {
  renderHours(summary.practiceHours);
}
```

**Optional computed fields (`?`):**

`practiceHours`, `examReadiness` là derived data — tính từ attempt data. Nếu backend chưa compute (performance optimization, lazy load), field có thể undefined. Component cần handle:

```tsx
{summary.examReadiness !== undefined && (
  <ExamReadinessWidget value={summary.examReadiness} />
)}
```

**`null` vs `undefined` convention:**

- `null`: Giá trị explict "không có" — backend trả về `null` trong JSON
- `undefined`: Field không có trong object — backend không trả field này

JSON serialize: `null` → `null` trong JSON. `undefined` → field bị omit hoàn toàn.

---

## Q6. TypeScript strict mode trong dự án. Điều này ảnh hưởng code như thế nào?

**Trả lời:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true  // Bật toàn bộ strict flags
  }
}
```

`strict: true` bật nhiều flags:

**1. `strictNullChecks` (quan trọng nhất):**
```typescript
// Không có strictNullChecks:
const user: AuthUser = null; // OK!
user.email; // Runtime crash

// Với strictNullChecks:
const user: AuthUser | null = null; // Phải declare null explicitly
if (user !== null) {
  user.email; // ✅ TypeScript biết là AuthUser
}
```

**2. `noImplicitAny`:**
```typescript
// Không có noImplicitAny:
function process(data) { // data: any (implicit) — OK
  return data.value; // No type check
}

// Với noImplicitAny:
function process(data) { // ❌ ERROR: Parameter 'data' implicitly has 'any' type
  // Phải annotate: function process(data: SomeType)
}
```

**3. `strictFunctionTypes`:**
Đảm bảo function type compatibility checking chặt hơn khi assign callbacks.

**Hệ quả trong dự án:**

```typescript
// Phổ biến: optional chaining vì strictNullChecks
const learnerId = user?.profileId ?? user?.id;
//              ↑ user có thể null → phải dùng ?.

// Phổ biến: null checks trước khi dùng
if (!learnerId || !isValidUUID(learnerId)) {
  return;
}

// TypeScript sẽ bắt lỗi:
const band = summary.latestOverallBand.toFixed(1);
// ❌ ERROR: Object is possibly 'null'
// Fix:
const band = (summary.latestOverallBand ?? 0).toFixed(1);
```

Strict mode giúp catch nhiều bugs tại compile time, nhưng cần code verbose hơn với null checks.
