import { Sidebar } from "@/components/layout/sidebar";
import { ProjectProvider } from "@/components/layout/project-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProjectProvider>
  );
}
