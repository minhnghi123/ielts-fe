import { Suspense } from "react";
import EditWritingFormInner from "./_components/EditWritingForm";
export default async function EditWritingTestPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading…</div>}>
      <EditWritingFormInner testId={resolvedParams.id} />
    </Suspense>
  );
}
