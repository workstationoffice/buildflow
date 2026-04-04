"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { MapPin, Camera, RotateCcw, CheckCircle } from "lucide-react";

export default function CheckInPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [step, setStep] = useState<"location" | "selfie" | "confirm">("location");
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [siteId, setSiteId] = useState("");
  const [dealId, setDealId] = useState("");
  const [isUnplanned, setIsUnplanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocation = () => {
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
        setStep("selfie");
      },
      () => setError("Could not get location. Please allow location access."),
      { enableHighAccuracy: true }
    );
  };

  const captureSelfie = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) {
      setSelfie(img);
      setStep("confirm");
    }
  }, [webcamRef]);

  const retakeSelfie = () => {
    setSelfie(null);
    setStep("selfie");
  };

  const submitCheckIn = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("address", location.address);
      fd.append("isUnplanned", String(isUnplanned));
      if (siteId) fd.append("siteId", siteId);
      if (dealId) fd.append("dealId", dealId);
      if (selfie) {
        const blob = await (await fetch(selfie)).blob();
        fd.append("selfie", blob, "selfie.jpg");
      }

      const res = await fetch("/api/check-in", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/visits");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Check In</h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 text-sm">{error}</div>
      )}

      {step === "location" && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="text-center text-slate-500">
            <MapPin className="w-12 h-12 mx-auto text-blue-500 mb-3" />
            <p>We need your location to verify you are on site.</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isUnplanned}
                onChange={(e) => setIsUnplanned(e.target.checked)}
                className="rounded"
              />
              Unplanned visit
            </label>
          </div>

          <button
            onClick={getLocation}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Get My Location
          </button>
        </div>
      )}

      {step === "selfie" && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="text-center text-slate-500 mb-2">
            <Camera className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-sm">Take a selfie to confirm your presence</p>
          </div>
          <div className="rounded-lg overflow-hidden bg-black aspect-square">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: "user" }}
            />
          </div>
          <button
            onClick={captureSelfie}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Capture Selfie
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-5 h-5" /> Ready to check in
          </div>

          {selfie && (
            <div className="relative">
              <img src={selfie} alt="Selfie preview" className="rounded-lg w-full aspect-square object-cover" />
              <button
                onClick={retakeSelfie}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {location && (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              <MapPin className="w-4 h-4 inline mr-1" />
              {location.address}
            </div>
          )}

          <button
            onClick={submitCheckIn}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Checking in..." : "Confirm Check In"}
          </button>
        </div>
      )}
    </div>
  );
}
