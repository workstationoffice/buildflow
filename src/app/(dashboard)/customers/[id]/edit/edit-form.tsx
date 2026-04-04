"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, User, Phone, Mail, MessageCircle, MapPin,
  FileText, Plus, Trash2, ArrowLeft, Hash, AlertCircle, CheckCircle,
} from "lucide-react";

interface ContactPersonRow {
  id?: string;
  name: string;
  position: string;
  phone: string;
  lineId: string;
}

interface Customer {
  id: string;
  type: "PERSONAL" | "COMPANY";
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  lineId: string | null;
  taxId: string | null;
  address: string | null;
  notes: string | null;
  contactPersons: ContactPersonRow[];
}

// ── Tax ID helpers ─────────────────────────────────────────────────────────
function formatTaxId(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 13);
}
function validateTaxId(v: string): string {
  if (!v) return "";
  if (!/^\d+$/.test(v)) return "Tax ID must contain only numbers";
  if (v.length !== 13) return `Tax ID must be 13 digits (${v.length}/13)`;
  return "";
}

// ── Phone helpers ──────────────────────────────────────────────────────────
function parseStoredPhone(stored: string | null): string {
  if (!stored) return "";
  let d = stored.replace(/\D/g, "");
  if (d.startsWith("66")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 9);
}
function normalizePhoneInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("66")) d = d.slice(2);
  return d.slice(0, 9);
}
function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}
function validatePhone(digits: string): string {
  if (!digits) return "";
  if (digits.length !== 9) return `Phone must be 9 digits after +66 (${digits.length}/9)`;
  if (!/^[689]/.test(digits)) return "Thai mobile must start with 6, 8, or 9";
  return "";
}
function toStoredPhone(digits: string): string {
  return digits ? `+66${digits}` : "";
}

const emptyContact = (): ContactPersonRow => ({ name: "", position: "", phone: "", lineId: "" });

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();

  const [type, setType]             = useState(customer.type);
  const [name, setName]             = useState(customer.name);
  const [companyName, setCompanyName] = useState(customer.companyName ?? "");
  const [email, setEmail]           = useState(customer.email ?? "");
  const [phoneDigits, setPhoneDigits] = useState(parseStoredPhone(customer.phone));
  const [lineId, setLineId]         = useState(customer.lineId ?? "");
  const [taxId, setTaxId]           = useState(customer.taxId ?? "");
  const [address, setAddress]       = useState(customer.address ?? "");
  const [notes, setNotes]           = useState(customer.notes ?? "");
  const [contacts, setContacts]     = useState<ContactPersonRow[]>(
    customer.contactPersons.length > 0
      ? customer.contactPersons.map((c) => ({
          ...c,
          position: c.position ?? "",
          phone: parseStoredPhone(c.phone),
          lineId: c.lineId ?? "",
        }))
      : [emptyContact()]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const taxIdError = validateTaxId(taxId);
  const phoneError = validatePhone(phoneDigits);

  const updateContact = (i: number, field: keyof ContactPersonRow, value: string) =>
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taxId && taxIdError) { setError(taxIdError); return; }
    if (phoneDigits && phoneError) { setError(phoneError); return; }

    setError("");
    setLoading(true);
    try {
      const filledContacts = contacts.filter((c) => c.name.trim()).map(({ id: _id, ...rest }) => ({
        ...rest,
        phone: rest.phone ? toStoredPhone(normalizePhoneInput(rest.phone)) : undefined,
      }));
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          companyName: type === "COMPANY" ? companyName : null,
          email: email || null,
          phone: toStoredPhone(phoneDigits) || null,
          lineId: lineId || null,
          taxId: taxId || null,
          address: address || null,
          notes: notes || null,
          contactPersons: filledContacts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update customer");
      router.push(`/customers/${customer.id}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Customer</h1>
          <p className="text-slate-500 text-sm mt-0.5">{customer.companyName ?? customer.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Type toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Customer Type</h2>
          <div className="flex gap-3">
            {(["COMPANY", "PERSONAL"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  type === t ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}>
                {t === "COMPANY" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {t === "COMPANY" ? "Company" : "Personal"}
              </button>
            ))}
          </div>
        </div>

        {/* Tax ID */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-white" />
            </div>
            Tax ID
          </h2>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
            <div className="relative">
              <input
                value={taxId}
                onChange={(e) => setTaxId(formatTaxId(e.target.value))}
                inputMode="numeric"
                maxLength={13}
                placeholder="0000000000000"
                className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none transition-colors ${
                  taxId && taxIdError ? "border-red-400 bg-red-50" :
                  taxId && !taxIdError ? "border-emerald-400 bg-emerald-50" :
                  "border-slate-200 focus:border-violet-500"
                }`}
              />
              {taxId && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold ${taxId.length === 13 ? "text-emerald-600" : "text-slate-400"}`}>
                  {taxId.length}/13
                </span>
              )}
            </div>
            {taxId && taxIdError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{taxIdError}</p>}
            {taxId && !taxIdError && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Valid 13-digit Tax ID</p>}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            Basic Information
          </h2>

          {type === "COMPANY" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Company Name <span className="text-red-500">*</span></label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{type === "COMPANY" ? "Primary Contact Name" : "Full Name"} <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone +66 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-500" />Phone</label>
              <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${
                phoneDigits && phoneError ? "border-red-400" :
                phoneDigits && !phoneError ? "border-emerald-400" :
                "border-slate-200 focus-within:border-violet-500"
              }`}>
                <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-600 shrink-0 select-none">+66</span>
                <input
                  value={formatPhoneDisplay(phoneDigits)}
                  onChange={(e) => setPhoneDigits(normalizePhoneInput(e.target.value))}
                  inputMode="tel"
                  placeholder="81-234-5678"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                />
              </div>
              {phoneDigits && phoneError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{phoneError}</p>}
              {phoneDigits && !phoneError && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />+66{phoneDigits}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@company.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-green-500" />LINE ID</label>
            <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="@lineid"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="ที่อยู่ / Full address..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          </div>
        </div>

        {/* Contact Persons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              Contact Persons
            </h2>
            <button type="button" onClick={() => setContacts((p) => [...p, emptyContact()])}
              className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact #{i + 1}</span>
                  {contacts.length > 1 && (
                    <button type="button" onClick={() => setContacts((p) => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Name *</label>
                    <input value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder="Full name"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Position</label>
                    <input value={c.position} onChange={(e) => updateContact(i, "position", e.target.value)} placeholder="Position"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Phone</label>
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden focus-within:border-violet-500 transition-colors">
                      <span className="px-2 py-2 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-500 select-none">+66</span>
                      <input
                        value={formatPhoneDisplay(normalizePhoneInput(c.phone))}
                        onChange={(e) => updateContact(i, "phone", normalizePhoneInput(e.target.value))}
                        inputMode="tel" placeholder="81-234-5678"
                        className="flex-1 px-2 py-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">LINE ID</label>
                    <input value={c.lineId} onChange={(e) => updateContact(i, "lineId", e.target.value)} placeholder="LINE ID"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            disabled={loading || !name || (type === "COMPANY" && !companyName) || !!(taxId && taxIdError) || !!(phoneDigits && phoneError)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-violet-100">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
