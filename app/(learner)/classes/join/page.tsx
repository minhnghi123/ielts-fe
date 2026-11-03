"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { classroomApi } from "@/lib/api/classroom";

function JoinByLinkPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [text, setText] = useState("Joining class…");
  useEffect(() => {
    const code = params.get("code");
    if (!code) { router.replace("/classes"); return; }
    classroomApi.joinClass(code).then((r) => {
      setText(r.status === "pending" ? `Request sent to ${r.className}. Your teacher will approve it.` : `You are in ${r.className}!`);
      setTimeout(() => router.replace(r.status === "pending" ? "/classes" : `/classes/${r.classId}`), 1200);
    }).catch((e) => { setText(e?.response?.data?.message || e?.response?.data?.error?.message || "This join link is not valid."); setTimeout(() => router.replace("/classes"), 2000); });
  }, [params, router]);
  return <div className="p-12 text-center text-sm text-muted-foreground" role="status">{text}</div>;
}

export default function JoinByLinkPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <JoinByLinkPageInner />
    </Suspense>
  );
}
