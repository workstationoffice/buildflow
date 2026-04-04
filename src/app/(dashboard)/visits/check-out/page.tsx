"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";

export default function CheckOutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitId = searchParams.get("visitId");

  const [jobSummary, setJobSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitCheckOut = async () => {
    if (!visitId || !jobSummary.trim()) {
      setError("Please provide a job summary");
      return;
    }
    setLoading(true);
    setError("");
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await fetch("/api/check-out", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
              jobSummary,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          router.push("/visits");
        },
        () => setError("Could not get location")
      );
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Check Out</h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="text-center text-slate-500">
          <LogOut className="w-10 h-10 mx-auto text-orange-500 mb-2" />
          <p className="text-sm">Summarize what you did on site today</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job Summary *</label>
          <textarea
            value={jobSummary}
            onChange={(e) => setJobSummary(e.target.value)}
            rows={5}
            placeholder="Describe the work completed on site..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          onClick={submitCheckOut}
          disabled={loading || !jobSummary.trim()}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {loading ? "Checking out..." : "Confirm Check Out"}
        </button>
      </div>
    </div>
  );
}
