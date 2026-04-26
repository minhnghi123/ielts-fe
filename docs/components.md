# Frontend — Components

---

## UI Component Library (`components/ui/`)

17 headless Radix UI-based components wrapped with Tailwind CSS styling. All are client components.

### Layout & Structure

| Component | File | Based on | Description |
|---|---|---|---|
| `Card` | `card.tsx` | div | Container with border, padding, and shadow variants |
| `Separator` | `separator.tsx` | Radix Separator | Horizontal or vertical divider line |

### Form Controls

| Component | File | Based on | Props | Description |
|---|---|---|---|---|
| `Button` | `button.tsx` | button | `variant`, `size`, `asChild` | Styled button with variants: default, outline, ghost, destructive, link |
| `Input` | `input.tsx` | input | Standard HTML input props | Styled text input with focus ring |
| `Label` | `label.tsx` | Radix Label | `htmlFor` | Accessible form label |
| `Checkbox` | `checkbox.tsx` | Radix Checkbox | `checked`, `onCheckedChange` | Accessible checkbox |
| `Select` | `select.tsx` | Radix Select | `value`, `onValueChange`, `children` | Dropdown select with `SelectItem`, `SelectContent`, `SelectTrigger` |
| `Slider` | `slider.tsx` | Radix Slider | `value`, `min`, `max`, `step`, `onValueChange` | Range slider (used for band target setting) |

### Feedback & Display

| Component | File | Based on | Description |
|---|---|---|---|
| `Badge` | `badge.tsx` | span | Colored pill label with variants: default, secondary, destructive, outline |
| `Progress` | `progress.tsx` | Radix Progress | Linear progress bar with percentage |
| `Avatar` | `avatar.tsx` | Radix Avatar | User avatar with image + fallback initials |
| `AvatarUpload` | `avatar-upload.tsx` | Custom | Avatar with crop-and-upload UI (react-image-crop + Cloudinary) |

### Overlays & Navigation

| Component | File | Based on | Description |
|---|---|---|---|
| `Dialog` | `dialog.tsx` | Radix Dialog | Modal dialog with `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter` |
| `AlertDialog` | `alert-dialog.tsx` | Radix AlertDialog | Confirmation dialog (used for delete actions) |
| `DropdownMenu` | `dropdown-menu.tsx` | Radix DropdownMenu | Contextual action menu |

### Content Organization

| Component | File | Based on | Description |
|---|---|---|---|
| `Accordion` | `accordion.tsx` | Radix Accordion | Collapsible content sections |
| `Tabs` | `tabs.tsx` | Radix Tabs | Tab navigation with `TabsList`, `TabsTrigger`, `TabsContent` |

### Usage Pattern

All UI components follow the Radix + CVA (class-variance-authority) pattern:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

// Button with variant
<Button variant="outline" size="sm" onClick={handleClick}>
  Cancel
</Button>

// Confirmation dialog
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>Are you sure?</AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Provider Components (`components/providers/`)

### QueryProvider

**File:** `components/providers/query-provider.tsx`

Wraps the app in `QueryClientProvider` and includes `ReactQueryDevtools` in development.

```tsx
// Usage — already applied in app/layout.tsx
<QueryProvider>
  {children}
</QueryProvider>
```

QueryClient config: see [state-management.md](state-management.md#queryClient-configuration).

---

### AuthHydrator

**File:** `components/providers/auth-hydrator.tsx`

A zero-render client component that populates the Zustand auth store from the `user` cookie on page mount.

```tsx
// Usage — already applied in app/layout.tsx
<AuthHydrator />
```

This is a `'use client'` component with no visible output. It runs `useEffect(() => hydrateFromCookie(), [])` exactly once on mount. This bridges the server-rendered cookie state to the client-side Zustand store.

---

## Admin-Specific Components

### Test Builder Components (`app/(admin)/admin/tests/add/_components/`)

| Component | Purpose |
|---|---|
| `SectionCard` | Collapsible card for a reading/listening section. Contains audio upload, passage editor, and child `GroupCard` list. |
| `GroupCard` | Collapsible card for a question group. Contains instruction editor and child `QuestionItem` list. |
| `QuestionItem` | Single question editor. Renders type-specific fields based on `questionType` + inline answer key input. |
| `SpeakingPartCard` | Editor for a single speaking part (Part 1/2/3 structure). |
| `WritingTaskCard` | Editor for Task 1 or Task 2 prompt with RichTextEditor and media URL. |
| `AudioUploader` | Drag-and-drop audio upload → `POST /api/upload/audio` → stores Cloudinary URL. |
| `ImageUploader` | Drag-and-drop image upload → `POST /api/upload/image` → stores Cloudinary URL. |

### Question Type Components (`app/(admin)/_components/questions/`)

Render-only preview components for the admin test preview interface:

| Component | Question Type |
|---|---|
| `MultipleChoiceQuestion` | Radio buttons with labeled options |
| `FillInBlankQuestion` | Inline blank inputs within sentence text |
| `MatchingQuestion` | Two-column select matching |
| `HeadingMatchingQuestion` | Paragraph-to-heading select matching |
| `MatchingFeaturesQuestion` | Feature-to-statement matching |
| `SentenceEndingQuestion` | Sentence start + ending select |

### RichTextEditor

**File:** `app/(admin)/_components/RichTextEditor.tsx`

React Quill-based rich text editor with image resize module. Used for:
- Writing task prompt editing (Task 1 & 2)
- Reading passage editing (HTML content)

---

## Test Interface Components (`app/(root)/practice/[id]/_components/`)

| Component | Skill | Description |
|---|---|---|
| `TestInstructions` | All | Modal overlay shown before test starts. Displays time limit, section count, instructions. |
| `ReadingTestInterface` | Reading | Split-panel: scrollable passage on left, question panel on right. Answers auto-saved to localStorage. |
| `ListeningTestInterface` | Listening | Audio player at top (Howler or HTML audio), question panel below. Auto-advances on completion. |
| `WritingTestInterface` | Writing | Task prompt display + rich text editors for Task 1 and Task 2 with live word count. |
| `SpeakingTestInterface` | Speaking | Chat-style interface. Sends user transcript to `/api/ai/speaking-chat`. Displays examiner messages and final grading. |

---

## Sidebar Navigation Components

### LearnerSidebar

**File:** `app/(learner)/_components/learner-sidebar.tsx`

Navigation links for learner pages:
- Dashboard (`/dashboard`)
- Analysis (`/analysis`)
- AI Advisor (`/ai-advisor`)
- Profile (`/profile`)
- Browse Tests (`/tests`)
- Logout button

### AdminSidebar

**File:** `app/(admin)/_components/admin-sidebar.tsx`

Navigation links for admin pages:
- Dashboard (`/admin/dashboard`)
- Tests (`/admin/tests`)
- Add Test (`/admin/tests/add`)
- Import (`/admin/tests/import`)
- AI Generator (`/admin/ai-generator`)
- Users (`/admin/users`)
- Settings (`/admin/settings`)
- Logout button

---

## Utility Function

**File:** `lib/utils.ts`

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Used everywhere to merge conditional Tailwind classes without conflicts:

```tsx
<div className={cn('base-class', condition && 'conditional-class', props.className)} />
```
