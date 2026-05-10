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
    const actor = newActorInput.trim().replace(/,$/, '');
    if (!actor) return;
    if (newProjectData.actors.includes(actor)) {
      alert('Este actor ya existe');
      return;
    }
    setNewProjectData((prev) => ({
      ...prev,
      actors: [...prev.actors, actor],
    }));
    setNewActorInput('');
  };

  const handleActorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddActor();
    }
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
        <Spinner size="lg" color="navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#263a5f]/10 rounded-xl text-[#263a5f] shadow-sm">
                <BugAntIcon className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">QA Bug Tracker</h1>
            </div>
            <p className="text-slate-500 text-sm md:text-base font-medium ml-1">Selecciona un proyecto para comenzar a registrar y seguir bugs</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="shadow-sm hover:shadow-md transition-all rounded-xl"
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
          <div className="text-center py-20 px-6 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BugAntIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ningún proyecto todavía</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Comienza creando tu primer proyecto para mantener un registro detallado de todos los bugs y mejoras.</p>
            <Button
              variant="primary"
              size="lg"
              className="rounded-xl"
              onClick={() => setShowNewProjectModal(true)}
              icon={<PlusCircleIcon className="w-5 h-5" />}
            >
              Crear Primer Proyecto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {projects.map((project) => {
              const bugCount = projectBugCounts[project.id] ?? 0;
              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${project.color || 'from-slate-400 to-slate-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        {project.icon}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#263a5f]/10 border border-[#263a5f]/15 rounded-full">
                        <span className="text-sm font-extrabold text-[#263a5f]">{bugCount}</span>
                        <BugAntIcon className="w-4 h-4 text-[#263a5f]" />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{project.name}</h2>
                    {project.description && (
                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{project.description}</p>
                    )}
                    {project.actors && project.actors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {project.actors.slice(0, 3).map((actor, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                          >
                            {actor}
                          </span>
                        ))}
                        {project.actors.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            +{project.actors.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold text-sm">
                    <span>Ver detalles</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
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
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Proyecto <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                placeholder="ej: Aplicación iOS"
                disabled={isLoading}
                maxLength={50}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descripción (opcional)</label>
              <textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                placeholder="Breve propósito del proyecto..."
                disabled={isLoading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                rows={3}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipos de Actores (Usuarios)</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                <div className="flex flex-wrap gap-2 mb-2">
                  {newProjectData.actors?.map((actor, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 shadow-sm text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium">
                      {actor}
                      <button
                        type="button"
                        onClick={() => handleRemoveActor(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                        aria-label={`Quitar ${actor}`}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={newActorInput}
                  onChange={(e) => setNewActorInput(e.target.value)}
                  placeholder="Escribe un actor y presiona Enter o coma"
                  disabled={isLoading}
                  onKeyDown={handleActorKeyDown}
                  className="w-full min-w-0 bg-transparent px-1 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 py-2.5 rounded-xl font-semibold"
                onClick={() => setShowNewProjectModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-2.5 rounded-xl bg-[#263a5f] hover:bg-[#1f3152] text-white font-semibold border-none shadow-sm"
                loading={isLoading}
              >
                Crear Proyecto
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
        <Spinner size="lg" color="navy" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
