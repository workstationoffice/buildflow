"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, User, Phone, Mail, MessageCircle, MapPin,
  FileText, Plus, Trash2, ArrowLeft, Search, CheckCircle,
  Loader2, AlertCircle, Hash,
} from "lucide-react";

interface ContactPersonRow {
  name: string;
  position: string;
  phone: string;
  lineId: string;
}

interface DbdResult {
  nameTh: string;
  nameEn: string;
  type: string;
  status: string;
  address: string;
}

const emptyContact = (): ContactPersonRow => ({ name: "", position: "", phone: "", lineId: "" });

// ── Tax ID helpers ─────────────────────────────────────────────────────────
function formatTaxId(raw: string) {
  // Allow only digits, max 13
  return raw.replace(/\D/g, "").slice(0, 13);
}

function validateTaxId(v: string): string {
  if (!v) return "";
  if (!/^\d+$/.test(v)) return "Tax ID must contain only numbers";
  if (v.length !== 13) return `Tax ID must be 13 digits (${v.length}/13)`;
  return "";
}

// ── Phone helpers ──────────────────────────────────────────────────────────
// Accepts input: 9 digits (without leading 0) or 10 digits (with leading 0)
// Displays formatted: XX-XXXX-XXXX
// Stores as: +66XXXXXXXXX
function normalizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);   // strip leading 0
  if (digits.startsWith("66")) digits = digits.slice(2);  // strip country code
  return digits.slice(0, 9);
}

function formatPhoneDisplay(digits: string): string {
  // digits = up to 9 chars, e.g. "812345678"
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

function validatePhone(digits: string): string {
  if (!digits) return "";
  if (!/^\d+$/.test(digits)) return "Phone must contain only numbers";
  if (digits.length !== 9) return `Phone must be 9 digits after +66 (${digits.length}/9)`;
  if (!/^[689]/.test(digits)) return "Thai mobile must start with 6, 8, or 9";
  return "";
}

function toStoredPhone(digits: string): string {
  return digits ? `+66${digits}` : "";
}

export default function NewCustomerPage() {
  const router = useRouter();

  const [type, setType]             = useState<"PERSONAL" | "COMPANY">("COMPANY");
  const [name, setName]             = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail]           = useState("");
  const [phoneDigits, setPhoneDigits] = useState(""); // 9 digits without +66
  const [lineId, setLineId]         = useState("");
  const [taxId, setTaxId]           = useState("");
  const [address, setAddress]       = useState("");
  const [notes, setNotes]           = useState("");
  const [contacts, setContacts]     = useState<ContactPersonRow[]>([emptyContact()]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // DBD state
  const [dbdLoading, setDbdLoading] = useState(false);
  const [dbdResult, setDbdResult]   = useState<DbdResult | null>(null);
  const [dbdError, setDbdError]     = useState("");

  // Derived validation
  const taxIdError   = validateTaxId(taxId);
  const phoneError   = validatePhone(phoneDigits);

  // ── DBD lookup ─────────────────────────────────────────────────────────
  const lookupDbd = async () => {
    setDbdError("");
    setDbdResult(null);
    if (taxIdError || !taxId) { setDbdError("Please enter a valid 13-digit Tax ID first"); return; }

    setDbdLoading(true);
    try {
      const res = await fetch(`/api/dbd-lookup?taxId=${taxId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "DBD lookup failed");

      setDbdResult(data);
      // Auto-fill fields
      if (data.nameTh) setCompanyName(data.nameTh);
      if (data.address) setAddress(data.address);
      setType("COMPANY");
    } catch (e: any) {
      setDbdError(e.message);
    } finally {
      setDbdLoading(false);
    }
  };

  // ── Phone input handler ────────────────────────────────────────────────
  const handlePhoneChange = (raw: string) => {
    setPhoneDigits(normalizePhoneInput(raw));
  };

  // ── Contact helpers ────────────────────────────────────────────────────
  const updateContact = (i: number, field: keyof ContactPersonRow, value: string) => {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taxId && taxIdError) { setError(taxIdError); return; }
    if (phoneDigits && phoneError) { setError(phoneError); return; }

    setError("");
    setLoading(true);
    try {
      const filledContacts = contacts.filter((c) => c.name.trim());
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          companyName: type === "COMPANY" ? companyName : undefined,
          email: email || undefined,
          phone: toStoredPhone(phoneDigits) || undefined,
          lineId: lineId || undefined,
          taxId: taxId || undefined,
          address: address || undefined,
          notes: notes || undefined,
          contactPersons: filledContacts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create customer");
      router.push(`/customers/${data.customer.id}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Customer</h1>
          <p className="text-slate-500 text-sm mt-0.5">Add a new customer to your CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Type toggle ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            Customer Type
          </h2>
          <div className="flex gap-3">
            {(["COMPANY", "PERSONAL"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  type === t
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {t === "COMPANY" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {t === "COMPANY" ? "Company" : "Personal"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tax ID + DBD Lookup ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-white" />
            </div>
            Tax ID &amp; DBD Lookup
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Tax ID (เลขประจำตัวผู้เสียภาษี / เลขนิติบุคคล)
            </label>

            {/* Input row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={taxId}
                  onChange={(e) => {
                    setTaxId(formatTaxId(e.target.value));
                    setDbdResult(null);
                    setDbdError("");
                  }}
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="0000000000000 (13 digits)"
                  className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none transition-colors ${
                    taxId && taxIdError
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : taxId && !taxIdError
                      ? "border-emerald-400 focus:border-emerald-500 bg-emerald-50"
                      : "border-slate-200 focus:border-violet-500"
                  }`}
                />
                {/* Digit counter */}
                {taxId && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold ${
                    taxId.length === 13 ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {taxId.length}/13
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={lookupDbd}
                disabled={dbdLoading || !!taxIdError || taxId.length !== 13}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 transition-all whitespace-nowrap shadow-sm"
              >
                {dbdLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</>
                  : <><Search className="w-4 h-4" /> Get from DBD</>
                }
              </button>
            </div>

            {/* Validation message */}
            {taxId && taxIdError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {taxIdError}
              </p>
            )}
            {taxId && !taxIdError && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Valid 13-digit Tax ID
              </p>
            )}

            {/* DBD error */}
            {dbdError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{dbdError}</p>
                  {dbdError.includes("DBD_API_KEY") && (
                    <p className="text-xs mt-0.5 text-red-500">
                      Add your key from{" "}
                      <span className="font-mono">opendata.dbd.go.th</span> to{" "}
                      <span className="font-mono">.env.local</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* DBD success result */}
            {dbdResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> ดึงข้อมูลสำเร็จ — ข้อมูลถูกกรอกอัตโนมัติแล้ว
                </p>
                <div className="text-xs text-emerald-800 space-y-0.5">
                  {dbdResult.nameTh && <p><span className="font-medium">ชื่อ (TH):</span> {dbdResult.nameTh}</p>}
                  {dbdResult.nameEn && <p><span className="font-medium">Name (EN):</span> {dbdResult.nameEn}</p>}
                  {dbdResult.type && <p><span className="font-medium">ประเภท:</span> {dbdResult.type}</p>}
                  {dbdResult.status && (
                    <p>
                      <span className="font-medium">สถานะ:</span>{" "}
                      <span className={dbdResult.status.includes("ยัง") ? "text-emerald-700 font-semibold" : "text-orange-700"}>
                        {dbdResult.status}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Basic Information ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            Basic Information
          </h2>

          {type === "COMPANY" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="e.g. บริษัท เอบีซี อินทีเรีย จำกัด"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {type === "COMPANY" ? "Primary Contact Name" : "Full Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. สมชาย ใจดี"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Phone with +66 prefix */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" /> Phone
              </label>
              <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${
                phoneDigits && phoneError
                  ? "border-red-400 focus-within:border-red-500"
                  : phoneDigits && !phoneError
                  ? "border-emerald-400 focus-within:border-emerald-500"
                  : "border-slate-200 focus-within:border-violet-500"
              }`}>
                <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-600 shrink-0 select-none">
                  +66
                </span>
                <input
                  value={formatPhoneDisplay(phoneDigits)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  inputMode="tel"
                  maxLength={11} // "XX-XXXX-XXXX" = 11 chars with dashes
                  placeholder="81-234-5678"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                />
              </div>
              {phoneDigits && phoneError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {phoneError}
                </p>
              )}
              {phoneDigits && !phoneError && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> +66{phoneDigits}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* LINE ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-green-500" /> LINE ID
            </label>
            <input
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="e.g. @company or lineid"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="ที่อยู่ / Full address..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* ── Contact Persons ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              Contact Persons
            </h2>
            <button
              type="button"
              onClick={() => setContacts((p) => [...p, emptyContact()])}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-semibold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>

          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Contact #{i + 1}
                  </span>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContacts((p) => p.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Name <span className="text-red-400">*</span></label>
                    <input
                      value={c.name}
                      onChange={(e) => updateContact(i, "name", e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Position</label>
                    <input
                      value={c.position}
                      onChange={(e) => updateContact(i, "position", e.target.value)}
                      placeholder="e.g. Procurement Manager"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Phone</label>
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden focus-within:border-violet-500 transition-colors">
                      <span className="px-2 py-2 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-500 select-none">+66</span>
                      <input
                        value={formatPhoneDisplay(normalizePhoneInput(c.phone))}
                        onChange={(e) => updateContact(i, "phone", normalizePhoneInput(e.target.value))}
                        inputMode="tel"
                        placeholder="81-234-5678"
                        className="flex-1 px-2 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">LINE ID</label>
                    <input
                      value={c.lineId}
                      onChange={(e) => updateContact(i, "lineId", e.target.value)}
                      placeholder="LINE ID"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name || (type === "COMPANY" && !companyName) || !!(taxId && taxIdError) || !!(phoneDigits && phoneError)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-violet-100"
          >
            {loading ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
