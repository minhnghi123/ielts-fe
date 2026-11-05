"use client";

import Link from "next/link";

interface Props {
  testCounts: Record<string, number>;
  attempts: unknown[];
  loading: boolean;
}

const SKILLS: Array<{ key: string; label: string }> = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];

/** Thay 4 thẻ icon ô màu bằng một dòng link vào ngân hàng đề theo kỹ năng. */
export function ModuleGrid({ testCounts, loading }: Props) {
  return (
    <section aria-label="Luyện tập theo kỹ năng">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Luyện tập</h2>
        <Link href="/drill" className="text-sm text-primary hover:underline">Luyện theo dạng câu</Link>
      </div>
      <ul className="mt-2 divide-y divide-border rounded-md bg-muted">
        {SKILLS.map((s) => (
          <li key={s.key}>
            <Link href={`/tests?skill=${s.key}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent">
              <span>{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {loading ? "…" : `${testCounts[s.key] ?? 0} đề`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
