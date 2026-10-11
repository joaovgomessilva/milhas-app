import { Suspense } from "react";
import { Results } from "@/components/Results";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="skeleton h-10 w-2/3 mb-4" /><div className="skeleton h-[420px]" /></div>}>
      <Results />
    </Suspense>
  );
}
