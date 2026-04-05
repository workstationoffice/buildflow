"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

export interface ThaiAddressValue {
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

interface Suggestion {
  subdistrict: string;
  district: string;
  province: string;
  zipcode: number;
}

interface Props {
  value: ThaiAddressValue;
  onChange: (val: ThaiAddressValue) => void;
}

export default function ThaiAddressFields({ value, onChange }: Props) {
  const [suggestions, setSuggestions]   = useState<Suggestion[]>([]);
  const [showDrop, setShowDrop]         = useState(false);
  const [searching, setSearching]       = useState(false);
  const [subInput, setSubInput]         = useState(value.subDistrict);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef                         = useRef<HTMLDivElement>(null);

  // Keep subInput in sync when value changes externally (e.g. reset)
  useEffect(() => { setSubInput(value.subDistrict); }, [value.subDistrict]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/thai-address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setShowDrop(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSubInput(v);
    onChange({ ...value, subDistrict: v, district: "", province: "", postalCode: "" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const selectSuggestion = (s: Suggestion) => {
    setSubInput(s.subdistrict);
    onChange({
      ...value,
      subDistrict: s.subdistrict,
      district:    s.district,
      province:    s.province,
      postalCode:  String(s.zipcode),
    });
    setSuggestions([]);
    setShowDrop(false);
  };

  const inputCls = "w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors";
  const readonlyCls = "w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-default";

  return (
    <div className="space-y-3">
      {/* Street / house no. */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
          <MapPin className="w-3 h-3" />ที่อยู่ / ถนน
        </label>
        <input
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="บ้านเลขที่ / ถนน / อาคาร"
          className={inputCls}
        />
      </div>

      {/* Sub-district autocomplete */}
      <div ref={wrapRef} className="relative space-y-1">
        <label className="text-xs font-medium text-slate-600">ตำบล / แขวง (Sub-district)</label>
        <div className="relative">
          <input
            value={subInput}
            onChange={handleSubChange}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            placeholder="พิมพ์ชื่อตำบล / แขวง..."
            className={inputCls}
            autoComplete="off"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {showDrop && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-900">{s.subdistrict}</span>
                <span className="text-slate-500 ml-1.5 text-xs">{s.district} · {s.province} · {s.zipcode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* District / Province / Postal — 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">อำเภอ / เขต</label>
          <div className={readonlyCls}>{value.district || <span className="text-slate-300">—</span>}</div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">จังหวัด</label>
          <div className={readonlyCls}>{value.province || <span className="text-slate-300">—</span>}</div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">รหัสไปรษณีย์</label>
          <input
            value={value.postalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            placeholder="10000"
            inputMode="numeric"
            maxLength={5}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
