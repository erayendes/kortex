"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ProjectContextValue {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue>({
  projectId: null,
  setProjectId: () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);

  // Persist selection in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("kortex-project-id");
    if (stored) setProjectId(stored);
  }, []);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem("kortex-project-id", projectId);
    }
  }, [projectId]);

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
