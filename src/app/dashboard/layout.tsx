import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-16 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
