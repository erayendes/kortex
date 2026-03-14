import { ProjectForm } from "@/components/projects/project-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  return (
    <div className="p-6">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Projeler
      </Link>

      <h1 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
        Yeni Proje
      </h1>

      <ProjectForm />
    </div>
  );
}
