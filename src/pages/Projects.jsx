import { useMemo } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { deriveDatasetEntities } from '../data/dataset.js';

export default function Projects() {
  const { activeDataset } = useDataset();

  if (!activeDataset) {
    return <EmptyState title="No Dataset Uploaded" message="Upload a dataset to view projects." />;
  }

  const { projects } = deriveDatasetEntities(activeDataset);

  if (!projects.length) return <EmptyState title="No projects found" message="No project-like columns detected in the uploaded dataset." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Browse projects detected from the uploaded dataset.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id || project.name} project={project} />
        ))}
      </div>
    </div>
  );
}
