import { Suspense } from "react";
import EditSpeakingFormInner from "./_components/EditSpeakingForm";
export default async function EditSpeakingTestPage({ params }: { params: { id: string } }) {
  const paramsId = await params;
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading…</div>}>
      <EditSpeakingFormInner params={paramsId} />
    </Suspense>
  );
}
