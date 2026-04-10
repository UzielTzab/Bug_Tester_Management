'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project } from '@/types';
import { DEFAULT_PROJECT_ID } from '@/lib/projects';
import { Button, Card, Spinner, Modal } from '@/components';
import {
  BugAntIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBugCounts, setProjectBugCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deletedProjectName, setDeletedProjectName] = useState<string | null>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: 'from-blue-500 to-cyan-500',
    actors: [] as string[],
  });
  const [newActorInput, setNewActorInput] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Leer parámetro de proyecto eliminado
        const projectDeleted = searchParams.get('projectDeleted');
        if (projectDeleted) {
          setDeletedProjectName(decodeURIComponent(projectDeleted));
        }

        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const data: Project[] = await projectsResponse.json();
          setProjects(data);
          
          // Contar bugs por proyecto
          const counts: Record<string, number> = {};
          for (const project of data) {
            const countResponse = await fetch(`/api/records?projectId=${encodeURIComponent(project.id)}`);
            if (countResponse.ok) {
              const records = await countResponse.json();
              counts[project.id] = Array.isArray(records) ? records.length : 0;
            }
          }
          setProjectBugCounts(counts);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [searchParams]);

  useEffect(() => {
    if (deletedProjectName) {
      const timer = setTimeout(() => {
        setDeletedProjectName(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [deletedProjectName]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newProjectData.name.toLowerCase().replace(/\s+/g, '-'),
          name: newProjectData.name,
          description: newProjectData.description,
          icon: newProjectData.icon || '📁',
          color: newProjectData.color,
          actors: newProjectData.actors,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setProjectBugCounts({ ...projectBugCounts, [newProject.id]: 0 });
        setShowNewProjectModal(false);
        setNewProjectData({
          name: '',
          description: '',
          icon: '📁',
          color: 'from-blue-500 to-cyan-500',
          actors: [],
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActor = () => {
    if (!newActorInput.trim()) return;
    if (newProjectData.actors.includes(newActorInput.trim())) {
      alert('Este actor ya existe');
      return;
    }
    setNewProjectData((prev) => ({
      ...prev,
      actors: [...prev.actors, newActorInput.trim()],
    }));
    setNewActorInput('');
  };

  const handleRemoveActor = (index: number) => {
    setNewProjectData((prev) => ({
      ...prev,
      actors: prev.actors.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--bg-light-gray)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BugAntIcon className="w-8 md:w-10 h-8 md:h-10 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">QA Bug Tracker</h1>
            </div>
            <p className="text-gray-600 text-sm md:text-base">Selecciona un proyecto para comenzar a registrar y seguir bugs</p>
          </div>
          <Button
            variant="success"
            size="lg"
            icon={<PlusCircleIcon className="w-5 h-5" />}
            onClick={() => setShowNewProjectModal(true)}
          >
            Crear Nuevo Proyecto
          </Button>
        </div>

        {/* Banner de proyecto eliminado */}
        {deletedProjectName && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 max-w-md bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg z-40">
            <div className="flex items-center gap-3">
              <div className="text-green-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-green-800 font-medium">Proyecto eliminado correctamente</p>
                <p className="text-green-700 text-sm">El proyecto <strong>{deletedProjectName}</strong> ha sido eliminado exitosamente.</p>
              </div>
            </div>
            <button
              onClick={() => setDeletedProjectName(null)}
              className="text-green-600 hover:text-green-800 transition-colors p-1 flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card variant="elevated" className="text-center py-12 md:py-16">
            <BugAntIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">No hay proyectos creados aún</p>
            <Button
              variant="success"
              onClick={() => setShowNewProjectModal(true)}
              icon={<PlusCircleIcon className="w-4 h-4" />}
            >
              Crear Primer Proyecto
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {projects.map((project) => {
              const bugCount = projectBugCounts[project.id] ?? 0;
              return (
                <Card
                  key={project.id}
                  variant="elevated"
                  className={`cursor-pointer transition-all hover:shadow-lg group h-full flex flex-col bg-gradient-to-br ${project.color}`}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-4xl">{project.icon}</span>
                      <div className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-sm font-bold text-gray-900">
                        {bugCount} 🐛
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{project.name}</h2>
                    {project.description && (
                      <p className="text-white text-opacity-90 text-sm mb-4">{project.description}</p>
                    )}
                    {project.actors && project.actors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.actors.slice(0, 3).map((actor, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-gradient-to-r from-indigo-500 to-blue-500 border border-indigo-700 text-white font-semibold text-xs px-3 py-1 rounded-full shadow-md"
                          >
                            {actor}
                          </span>
                        ))}
                        {project.actors.length > 3 && (
                          <span className="inline-block bg-gradient-to-r from-indigo-500 to-blue-500 border border-indigo-700 text-white font-semibold text-xs px-3 py-1 rounded-full shadow-md">
                            +{project.actors.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white border-opacity-20 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      icon={<ArrowRightIcon className="w-4 h-4" />}
                    >
                      Abrir
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}


        {/* Create Project Modal */}
        <Modal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          title="✨ Crear Nuevo Proyecto"
          size="sm"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Proyecto *</label>
              <input
                type="text"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                placeholder="ej: Proyecto Beta"
                disabled={isLoading}
                maxLength={50}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Descripción (opcional)</label>
              <textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                placeholder="Descripción breve del proyecto..."
                disabled={isLoading}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none"
                rows={2}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tipos de Actores (Usuarios)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newActorInput}
                  onChange={(e) => setNewActorInput(e.target.value)}
                  placeholder="Ej: Cliente, Proveedor..."
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddActor()}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAddActor}
                  disabled={isLoading}
                >
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newProjectData.actors?.map((actor, idx) => (
                  <div key={idx} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    {actor}
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveActor(idx);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowNewProjectModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                className="flex-1"
                loading={isLoading}
              >
                Crear
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
