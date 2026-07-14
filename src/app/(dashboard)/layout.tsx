import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-4 pb-8 pt-16 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
