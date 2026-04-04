import { Sidebar } from "@/components/layout/sidebar";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireTenantUser } from "@/lib/auth";
import { Bell, Search } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await requireTenantUser();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-400">Search...</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
              <UserButton />
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
