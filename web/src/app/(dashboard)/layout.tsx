import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <DashboardNav />
      <main className="min-w-0 flex-1 px-5 pt-6 pb-8 lg:px-12 lg:pt-10 lg:pb-14">{children}</main>
    </div>
  );
}
