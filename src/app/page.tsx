'use client';

import { useState, useEffect, useRef, type ChangeEvent, type ClipboardEvent, type FormEvent } from 'react';
import { TestRecord, TipoError, Estado, Actor, DeviceType, Project } from '@/types';
import { downloadPDF } from '@/lib/pdf';
import { TIPOS_ERROR, ESTADOS, ACTORES, DISPOSITIVOS, tipoColors, estadoColors, actorColors } from '@/lib/config';
import { PROJECTS, DEFAULT_PROJECT_ID, getProject } from '@/lib/projects';
import { migrateRecordsToProject, getRecordsByProject, getProjects, addProject, createProjectWithId, updateProject } from '@/lib/db';
import { Button, Card, Badge, Input, Modal, Spinner, SkeletonLoader, ImageEditor } from '@/components';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  PlusCircleIcon,
  BugAntIcon,
  PhotoIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  FlagIcon,
  PencilSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';


export default function Dashboard() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBugCounts, setProjectBugCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectData, setEditingProjectData] = useState({
    name: '',
    description: '',
    actors: [] as string[],
  });
  const [newActorInput, setNewActorInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [recordModal, setRecordModal] = useState<TestRecord | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Estado | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [migrationDone, setMigrationDone] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'kanban'>('list');
  const [draggingRecordId, setDraggingRecordId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: 'from-blue-500 to-cyan-500',
    actors: [] as string[],
  });
  const [formData, setFormData] = useState({
    actor: 'Cliente' as Actor,
    modulo: '',
    tipoError: 'Funcionalidad' as TipoError,
    device: 'Mobile' as DeviceType,
    resolution: '',
    titulo: '',
    pasosReproducir: '',
    resultadoEsperado: '',
    resultadoActual: '',
    evidencia: [] as string[],
    estado: 'Pendiente' as Estado,
    notasDev: '',
  });

  useEffect(() => {
    // Ejecutar migración y cargar proyectos UNA SOLA VEZ
    const runInitialization = async () => {
      if (!migrationDone) {
        try {
          // Asegurar que el proyecto "Sumo" existe
          const existingProjects = await getProjects();
          const sumoExists = existingProjects.some((p) => p.id === 'sumo');
          
          if (!sumoExists) {
            await createProjectWithId('sumo', {
              name: 'Proyecto Sumo',
              description: 'Proyecto principal con todos los registros de bugs',
              color: 'from-blue-500 to-cyan-500',
              icon: '🔵',
            });
          }
          
          // Migrar registros antiguos a 'sumo'
          await migrateRecordsToProject(DEFAULT_PROJECT_ID);
          setMigrationDone(true);
        } catch (error) {
          console.error('Initialization error:', error);
        }
      }
      
      // Cargar proyectos y registros
      await loadProjects();
      await fetchRecords();
    };
    runInitialization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar registros cuando cambia el proyecto
  useEffect(() => {
    if (migrationDone) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  const loadProjects = async () => {
    try {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);
      
      // Cargar conteos de bugs para cada proyecto
      const counts: Record<string, number> = {};
      for (const project of loadedProjects) {
        const projectRecords = await getRecordsByProject(project.id);
        counts[project.id] = projectRecords.length;
      }
      setProjectBugCounts(counts);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || !newProjectData.name.trim()) return;
    
    setIsLoading(true);
    try {
      const newProject = await addProject({
        name: newProjectData.name,
        description: newProjectData.description,
        color: newProjectData.color,
        icon: newProjectData.icon,
        actors: newProjectData.actors,
      });
      
      setProjects([...projects, newProject]);
      setProjectBugCounts({...projectBugCounts, [newProject.id]: 0});
      setCurrentProjectId(newProject.id);
      setShowNewProjectModal(false);
      setNewProjectData({
        name: '',
        description: '',
        icon: '📁',
        color: 'from-blue-500 to-cyan-500',
        actors: [],
      });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Abrir modal para editar proyecto
   */
  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectData({
      name: project.name,
      description: project.description || '',
      actors: project.actors || [],
    });
    setNewActorInput('');
  };

  /**
   * Guardar cambios del proyecto
   */
  const handleSaveProjectEdit = async () => {
    if (!editingProjectData.name.trim() || !editingProjectId) return;
    setIsLoading(true);
    try {
      await updateProject(editingProjectId, {
        name: editingProjectData.name,
        description: editingProjectData.description,
        actors: editingProjectData.actors,
      });
      const updatedProjects = projects.map((p) =>
        p.id === editingProjectId
          ? { ...p, name: editingProjectData.name, description: editingProjectData.description, actors: editingProjectData.actors }
          : p
      );
      setProjects(updatedProjects);
      setEditingProjectId(null);
      setEditingProjectData({ name: '', description: '', actors: [] });
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Agregar nuevo actor al proyecto en edición
   */
  const handleAddActor = () => {
    if (!newActorInput.trim()) return;
    if (editingProjectData.actors.includes(newActorInput.trim())) {
      alert('Este actor ya existe');
      return;
    }
    setEditingProjectData(prev => ({
      ...prev,
      actors: [...prev.actors, newActorInput.trim()]
    }));
    setNewActorInput('');
  };

  /**
   * Remover actor del proyecto en edición
   */
  const handleRemoveActor = (index: number) => {
    setEditingProjectData(prev => ({
      ...prev,
      actors: prev.actors.filter((_, i) => i !== index)
    }));
  };

  /**
   * Cancelar edición de proyecto
   */
  const handleCancelProjectEdit = () => {
    setEditingProjectId(null);
    setEditingProjectData({ name: '', description: '', actors: [] });
    setNewActorInput('');
  };

  const fetchRecords = async () => {
    setIsLoadingProject(true);
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      // Filtrar por proyecto actual y ordenar
      const filteredData = (data || []).filter((record: TestRecord) => record.projectId === currentProjectId);
      const sortedData = filteredData.sort((a: TestRecord, b: TestRecord) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      setRecords(sortedData);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
      setIsLoadingProject(false);
    }
  };

  const resetForm = () => {
    setFormData({
      actor: 'Cliente',
      modulo: '',
      tipoError: 'Funcionalidad',
      device: 'Mobile',
      resolution: '',
      titulo: '',
      pasosReproducir: '',
      resultadoEsperado: '',
      resultadoActual: '',
      evidencia: [],
      estado: 'Pendiente',
      notasDev: '',
    });
    setEditingId(null);
  };

  const isImageData = (s?: string | null) => {
    return typeof s === 'string' && s.startsWith('data:image');
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, evidencia: [...prev.evidencia, result] }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setFormData((prev) => ({ ...prev, evidencia: [...prev.evidencia, reader.result as string] }));
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleEditImage = (imageIndex: number) => {
    setEditingImageIndex(imageIndex);
    setShowImageEditor(true);
  };

  const handleSaveEditedImage = (editedImage: string) => {
    if (editingImageIndex !== null) {
      setFormData((prev) => {
        const newEvidencia = [...prev.evidencia];
        newEvidencia[editingImageIndex] = editedImage;
        return { ...prev, evidencia: newEvidencia };
      });
    }
    setShowImageEditor(false);
    setEditingImageIndex(null);
  };

  const handleCancelImageEdit = () => {
    setShowImageEditor(false);
    setEditingImageIndex(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const payload = { ...formData, projectId: currentProjectId } as any;
      if (editingId) {
        await fetch(`/api/records/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await fetchRecords();
      // Recargar conteos después de agregar/editar
      const projectRecords = await getRecordsByProject(currentProjectId);
      setProjectBugCounts({...projectBugCounts, [currentProjectId]: projectRecords.length});
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: TestRecord) => {
    setFormData({
      actor: record.actor || 'Cliente',
      modulo: record.modulo || '',
      tipoError: record.tipoError || 'Funcionalidad',
      device: record.device || 'Mobile',
      resolution: record.resolution || '',
      titulo: record.titulo || '',
      pasosReproducir: record.pasosReproducir || '',
      resultadoEsperado: record.resultadoEsperado || '',
      resultadoActual: record.resultadoActual || '',
      evidencia: Array.isArray(record.evidencia) ? record.evidencia : (record.evidencia ? [record.evidencia] : []),
      estado: record.estado || 'Pendiente',
      notasDev: record.notasDev || '',
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch(`/api/records/${id}`, { method: 'DELETE' });
      await fetchRecords();
      // Recargar conteos después de eliminar
      const projectRecords = await getRecordsByProject(currentProjectId);
      setProjectBugCounts({...projectBugCounts, [currentProjectId]: projectRecords.length});
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch('/api/records', { method: 'DELETE' });
      await fetchRecords();
      // Recargar todos los conteos
      const counts: Record<string, number> = {};
      for (const project of projects) {
        const projectRecords = await getRecordsByProject(project.id);
        counts[project.id] = projectRecords.length;
      }
      setProjectBugCounts(counts);
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Error deleting all records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, estado: Estado) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch(`/api/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      fetchRecords();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const projectName = currentProject?.name || 'Proyecto';
      await downloadPDF(records, projectName);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (recordId: string) => {
    setDraggingRecordId(recordId);
  };

  const handleDragEnd = () => {
    setDraggingRecordId(null);
  };

  const handleDropStatus = async (targetStatus: Estado) => {
    if (!draggingRecordId) return;
    await handleStatusChange(draggingRecordId, targetStatus);
    setDraggingRecordId(null);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const getFilteredRecords = () => {
    let filtered = records;

    // Filtrar por estado
    if (filterStatus !== 'Todos') {
      filtered = filtered.filter(r => r.estado === filterStatus);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.titulo?.toLowerCase().includes(term) ||
        r.modulo?.toLowerCase().includes(term) ||
        r.tipoError?.toLowerCase().includes(term) ||
        r.notasDev?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="purple" variant="modern" />
          <p className="mt-4 text-xl font-semibold text-gray-900">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden" style={{ backgroundColor: 'var(--bg-light-gray)' }}>
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 p-4 md:p-6 md:fixed md:h-screen md:overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BugAntIcon className="w-5 h-5" />
          Proyectos
        </h2>
        
        <div className="space-y-3 mb-6">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              Cargando proyectos...
            </p>
          ) : (
            projects.map((project) => {
              const bugCount = projectBugCounts[project.id] ?? 0;
              const isActive = currentProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => setCurrentProjectId(project.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all group ${ 
                    isActive
                      ? `bg-gradient-to-r ${project.color} text-white border-blue-700 scale-105`
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{project.icon}</span>
                      <div>
                        <div className="font-bold text-sm">{project.name}</div>
                        {project.description && (
                          <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project);
                        }}
                        className={`p-1 rounded transition-all hover:bg-white/20 cursor-pointer ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        title="Editar proyecto"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </div>
                      <Badge variant={isActive ? 'info' : 'neutral'} className="text-xs">
                        {bugCount} 🐛
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Botón para crear nuevo proyecto */}
        <Button
          variant="success"
          fullWidth
          icon={<PlusCircleIcon className="w-4 h-4" />}
          onClick={() => setShowNewProjectModal(true)}
          disabled={isLoading}
          className="mb-4"
        >
          Nuevo Proyecto
        </Button>
      </div>

      {/* Main Content */}
      <div className="w-full md:flex-1 md:ml-64 p-4 md:p-6 overflow-x-hidden">
        <div className="w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <Card variant="elevated" className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <BugAntIcon className="w-6 md:w-8 h-6 md:h-8 text-red-600 flex-shrink-0" />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Registro de Bugs - QA Dashboard</h1>
          </div>
          <div className="flex gap-2 md:gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
            <Button
              variant="secondary"
              icon={<DocumentArrowDownIcon className="w-4 h-4" />}
              onClick={handleExport}
              disabled={records.length === 0 || isLoading}
              loading={isLoading}
              className="text-xs md:text-sm flex-1 md:flex-none"
            >
              Exportar PDF
            </Button>
            <Button
              variant="danger"
              icon={<TrashIcon className="w-4 h-4" />}
              onClick={() => setShowDeleteAllModal(true)}
              disabled={records.length === 0 || isLoading}
              className="text-xs md:text-sm flex-1 md:flex-none"
            >
              Limpiar
            </Button>
            
            {/* View Mode Toggle - Escondido en móviles muy pequeños */}
            <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2 md:px-3 py-2 transition-all text-sm md:text-base ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Vista de tarjetas"
              >
                <Squares2X2Icon className="w-4 md:w-5 h-4 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 md:px-3 py-2 transition-all border-l border-gray-300 text-sm md:text-base ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Vista de lista"
              >
                <ListBulletIcon className="w-4 md:w-5 h-4 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2 md:px-3 py-2 transition-all border-l border-gray-300 text-sm md:text-base ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Vista de tablero"
              >
                <ViewColumnsIcon className="w-4 md:w-5 h-4 md:h-5" />
              </button>
            </div>
            
            <Button
              variant="primary"
              icon={showForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              disabled={isLoading}
              className="text-xs md:text-sm flex-1 md:flex-none"
            >
              {showForm ? 'Cerrar' : 'Nuevo Bug'}
            </Button>
          </div>
        </Card>

        {/* Filtros y Búsqueda */}
        <Card variant="base" className="mb-6 overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Input
              label="🔍 Buscar"
              placeholder="Buscar por título, módulo, tipo de error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-900 mb-2">🏷️ Filtrar por Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Estado | 'Todos')}
                className="w-full px-3 md:px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200"
              >
                <option value="Todos">Todos</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-3 text-xs md:text-sm font-semibold text-gray-900">
            Mostrando {getFilteredRecords().length} de {records.length} registros
          </div>
        </Card>

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editingId ? 'Editar Bug/Observación' : 'Registrar Nuevo Bug/Observación'}
          size="lg"
        >
          <div onPaste={handlePaste} className="space-y-4">
            <p className="text-gray-600 text-sm">Todos los campos son opcionales. Puedes pegar imágenes directamente (Ctrl+V).</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECCIÓN ARRIBA: Imágenes, Título y Notas Dev */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                
                {/* Evidencia */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <PhotoIcon className="w-4 h-4 text-blue-600" />
                    Evidencia (Imágenes/Links)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="warning"
                      size="sm"
                      icon={<PhotoIcon className="w-4 h-4" />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Agregar Imagen
                    </Button>
                    {formData.evidencia.length > 0 && (
                      <span className="text-gray-900 text-sm self-center font-medium">
                        ({formData.evidencia.length} imagen{formData.evidencia.length !== 1 ? 'es' : ''})
                      </span>
                    )}
                  </div>
                  {formData.evidencia.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.evidencia.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Evidencia ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-80"
                            onClick={() => setImageModal(img)}
                            title="Clic para ver en grande"
                          />
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleEditImage(idx)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                              title="Editar imagen"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, evidencia: formData.evidencia.filter((_, i) => i !== idx) })}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                              title="Eliminar imagen"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Título como Textarea */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <PencilSquareIcon className="w-4 h-4 text-blue-600" />
                    Título del Error / Observación
                  </label>
                  <textarea
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    rows={2}
                    placeholder="Descripción breve del bug u observación"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>

                {/* Notas Dev */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                    Notas Dev
                  </label>
                  <textarea
                    value={formData.notasDev}
                    onChange={(e) => setFormData({ ...formData, notasDev: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="Notas para desarrollo..."
                  />
                </div>
              </div>

              {/* SECCIÓN ABAJO: Otros campos */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Actor */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      Actor / Tipo Usuario
                    </label>
                    <select
                      value={formData.actor}
                      onChange={(e) => setFormData({ ...formData, actor: e.target.value as Actor })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {(currentProject?.actors && currentProject.actors.length > 0 ? currentProject.actors : ACTORES).map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Módulo */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <MapPinIcon className="w-4 h-4 text-blue-600" />
                      Módulo / Página
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Login, Dashboard..."
                      value={formData.modulo}
                      onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>

                  {/* Tipo de Error */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-blue-600" />
                      Tipo de Error
                    </label>
                    <select
                      value={formData.tipoError}
                      onChange={(e) => setFormData({ ...formData, tipoError: e.target.value as TipoError })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {TIPOS_ERROR.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dispositivo */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <DevicePhoneMobileIcon className="w-4 h-4 text-blue-600" />
                      Dispositivo
                    </label>
                    <select
                      value={formData.device}
                      onChange={(e) => setFormData({ ...formData, device: e.target.value as DeviceType })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {DISPOSITIVOS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <FlagIcon className="w-4 h-4 text-blue-600" />
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as Estado })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <Button
                  variant="success"
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="flex-1"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Cards Grid / List View */}
        {viewMode === 'cards' ? (
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {isLoadingProject ? (
              <>
                {[1, 2, 3, 4].map((idx) => (
                  <SkeletonLoader key={`skeleton-${idx}`} count={1} height="h-48" className="rounded-lg" />
                ))}
              </>
            ) : getFilteredRecords().length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-900 font-semibold bg-gray-50 rounded-lg border-2 border-gray-200 text-sm md:text-base">
                {records.length === 0 ? 'No hay registros. ¡Haz clic en "Nuevo Bug" para empezar!' : 'No se encontraron registros con los filtros aplicados.'}
              </div>
            ) : (
              getFilteredRecords().map((record) => (
                <Card key={record.id} className="cursor-pointer transition-all overflow-hidden flex flex-col" onClick={() => setRecordModal(record)}>
                  {/* Estado badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div></div>
                    <div className="flex items-center gap-2">
                      {record.estado === 'Corregido' && (
                        <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                      )}
                      <Badge variant={record.estado === 'Corregido' ? 'success' : record.estado === 'En Progreso' ? 'info' : record.estado === 'Pendiente' ? 'warning' : 'neutral'} className="text-xs">
                        {record.estado}
                      </Badge>
                    </div>
                  </div>

                  {/* Imagen evidencia */}
                  <div className="flex justify-center items-center mb-3 h-24 bg-gray-50 rounded-lg border border-gray-200">
                    {record.evidencia && record.evidencia.length > 0 && isImageData(record.evidencia[0]) ? (
                      <div className="relative" onClick={(e) => { e.stopPropagation(); setImageModal(record.evidencia[0]); }}>
                        <img src={record.evidencia[0]} alt="Evidencia" className="h-20 w-20 object-cover rounded-lg cursor-pointer hover:opacity-80" />
                        {record.evidencia.length > 1 && (
                          <Badge variant="info" className="absolute top-0 right-0 text-xs">+{record.evidencia.length - 1}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Sin evidencia</span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className={`font-bold text-xs md:text-sm mb-2 truncate text-gray-900 ${record.estado === 'Corregido' ? 'line-through text-gray-600' : ''}`}>{record.titulo || '-'}</h3>

                  {/* Info principal */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {record.tipoError && <Badge variant="neutral" className="text-xs">{record.tipoError}</Badge>}
                    {record.device && <Badge variant="neutral" className="text-xs">{record.device}</Badge>}
                  </div>

                  {/* Módulo */}
                  {record.modulo && <div className="text-xs text-gray-600 mb-3 truncate">{record.modulo}</div>}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 mt-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(record); }} 
                      className="flex-1 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all" 
                      title="Editar"
                    >
                      <PencilIcon className="w-4 md:w-5 h-4 md:h-5 mx-auto" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} 
                      className="flex-1 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all" 
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 md:w-5 h-4 md:h-5 mx-auto" />
                    </button>
                    <select 
                      value={record.estado || 'Pendiente'} 
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(record.id, e.target.value as Estado); }} 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex-1 text-xs border border-gray-300 rounded px-1 py-1 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-600" 
                      title="Cambiar estado"
                    >
                      {ESTADOS.map((e) => (<option key={e} value={e} className="text-gray-900">{e}</option>))}
                    </select>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-2 md:space-y-3">
            {isLoadingProject ? (
              <>
                {[1, 2, 3, 4].map((idx) => (
                  <SkeletonLoader key={`skeleton-list-${idx}`} count={1} height="h-20" className="rounded-lg" />
                ))}
              </>
            ) : getFilteredRecords().length === 0 ? (
              <div className="text-center py-12 text-gray-900 font-semibold bg-gray-50 rounded-lg border-2 border-gray-200 text-sm md:text-base">
                {records.length === 0 ? 'No hay registros. ¡Haz clic en "Nuevo Bug" para empezar!' : 'No se encontraron registros con los filtros aplicados.'}
              </div>
            ) : (
              getFilteredRecords().map((record) => (
                <Card 
                  key={record.id} 
                  className="cursor-pointer transition-all p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden bg-white border border-gray-200"
                  onClick={() => setRecordModal(record)}
                >
                  {/* Imagen pequeña y título */}
                  <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0 w-full sm:w-auto">
                    {record.evidencia && record.evidencia.length > 0 && isImageData(record.evidencia[0]) ? (
                      <img 
                        src={record.evidencia[0]} 
                        alt="Evidencia" 
                        className="h-14 md:h-16 w-14 md:w-16 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); setImageModal(record.evidencia[0]); }}
                      />
                    ) : (
                      <div className="h-14 md:h-16 w-14 md:w-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-600">–</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-base md:text-lg text-gray-900 mb-2 ${record.estado === 'Corregido' ? 'line-through text-gray-600' : ''}`}>{record.titulo || '-'}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {record.tipoError && <Badge variant="neutral" className="text-xs bg-purple-100 text-purple-800">{record.tipoError}</Badge>}
                        {record.device && <Badge variant="neutral" className="text-xs bg-purple-200 text-purple-900">{record.device}</Badge>}
                        {record.actor && <Badge variant="neutral" className="text-xs bg-purple-100 text-purple-800">{record.actor}</Badge>}
                        {record.modulo && <Badge variant="neutral" className="text-xs bg-purple-100 text-purple-800">{record.modulo}</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex items-center gap-2 md:gap-3 ml-0 sm:ml-4 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      {record.estado === 'Corregido' && (
                        <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                      )}
                      <Badge 
                        variant={record.estado === 'Corregido' ? 'success' : record.estado === 'En Progreso' ? 'info' : record.estado === 'Pendiente' ? 'warning' : 'neutral'} 
                        className="text-xs whitespace-nowrap"
                      >
                        {record.estado}
                      </Badge>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(record); }} 
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all flex-shrink-0"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} 
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all flex-shrink-0"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <select 
                      value={record.estado || 'Pendiente'} 
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(record.id, e.target.value as Estado); }} 
                      onClick={(e) => e.stopPropagation()} 
                      className="text-xs border border-gray-300 rounded px-2 py-2 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-max flex-shrink-0"
                      title="Cambiar estado"
                    >
                      {ESTADOS.map((e) => (<option key={e} value={e} className="text-gray-900">{e}</option>))}
                    </select>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {ESTADOS.map((estado) => {
              const columnRecords = getFilteredRecords().filter((r) => r.estado === estado);
              return (
                <div
                  key={estado}
                  className="rounded-lg border border-gray-200 bg-white p-3 min-h-[320px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropStatus(estado)}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <Badge
                      variant={
                        estado === 'Corregido'
                          ? 'success'
                          : estado === 'En Progreso'
                          ? 'info'
                          : estado === 'Pendiente'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="text-xs"
                    >
                      {estado}
                    </Badge>
                    <span className="text-xs font-semibold text-gray-600">{columnRecords.length}</span>
                  </div>

                  <div className="space-y-2">
                    {isLoadingProject ? (
                      <SkeletonLoader count={2} height="h-24" className="rounded-lg" />
                    ) : columnRecords.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                        Arrastra bugs aqui
                      </div>
                    ) : (
                      columnRecords.map((record) => (
                        <div
                          key={record.id}
                          draggable
                          onDragStart={() => handleDragStart(record.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setRecordModal(record)}
                          className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all ${
                            draggingRecordId === record.id ? 'opacity-50' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`font-bold text-sm text-gray-900 line-clamp-2 ${record.estado === 'Corregido' ? 'line-through text-gray-600' : ''}`}>
                              {record.titulo || '-'}
                            </h3>
                            {record.estado === 'Corregido' && <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {record.tipoError && <Badge variant="neutral" className="text-[10px] bg-purple-100 text-purple-800">{record.tipoError}</Badge>}
                            {record.device && <Badge variant="neutral" className="text-[10px] bg-purple-200 text-purple-900">{record.device}</Badge>}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(record);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(record.id);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Image Modal */}
        {imageModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
            onClick={() => setImageModal(null)}
          >
            <div className="relative">
              <button
                onClick={() => setImageModal(null)}
                className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
              >
                ✕ Cerrar
              </button>
              <img  
                src={imageModal}
                alt="Evidencia ampliada"
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Image Editor Modal */}
        <Modal
          isOpen={showImageEditor && editingImageIndex !== null && formData.evidencia[editingImageIndex] !== undefined}
          onClose={handleCancelImageEdit}
          title="Editar Imagen"
          size="lg"
        >
          {editingImageIndex !== null && formData.evidencia[editingImageIndex] && (
            <ImageEditor
              initialImage={formData.evidencia[editingImageIndex]}
              onSave={handleSaveEditedImage}
              onCancel={handleCancelImageEdit}
            />
          )}
        </Modal>

        {/* Record Details Modal */}
        <Modal
          isOpen={!!recordModal}
          onClose={() => {
            setRecordModal(null);
            setExpandedNotes(false);
          }}
          title={recordModal?.titulo || recordModal?.id}
          size="lg"
        >
          {recordModal && (
            <div className="space-y-4">
              {/* Evidencia */}
              {recordModal.evidencia && (Array.isArray(recordModal.evidencia) ? recordModal.evidencia.length > 0 : recordModal.evidencia) && (
                <div>
                  {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia]).some(e => isImageData(e)) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Imágenes</h4>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia])
                          .filter(img => isImageData(img))
                          .map((img, idx) => (
                            <img key={idx} src={img} alt={`Evidencia ${idx + 1}`} className="h-32 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90" onClick={() => setImageModal(img)} />
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia]).some(e => typeof e === 'string' && (e.startsWith('http') || e.startsWith('https'))) && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Enlaces</h4>
                      <div className="flex flex-col gap-2">
                        {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia])
                          .filter(e => typeof e === 'string' && (e.startsWith('http') || e.startsWith('https')))
                          .map((url, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline break-all flex-1">
                                {url.length > 50 ? url.substring(0, 50) + '...' : url}
                              </a>
                              <Button size="sm" variant="secondary" onClick={() => handleCopyToClipboard(url)} className="whitespace-nowrap text-xs">
                                {copiedUrl === url ? '✓' : '📋'}
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info principal */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {recordModal.tipoError && <Badge variant="neutral">{recordModal.tipoError}</Badge>}
                  {recordModal.device && <Badge variant="neutral">{recordModal.device}</Badge>}
                  {recordModal.actor && <Badge variant="neutral">{recordModal.actor}</Badge>}
                  {recordModal.modulo && <Badge variant="neutral">{recordModal.modulo}</Badge>}
                </div>
              </div>

              {/* Notas Dev */}
              <div onClick={() => setExpandedNotes(!expandedNotes)} className="cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-1">Notas Dev</h4>
                <p className={`text-sm text-gray-600 transition-all ${expandedNotes ? 'line-clamp-none' : 'line-clamp-2'}`}>
                  {recordModal.notasDev || <span className="text-gray-400 italic">Sin notas</span>}
                </p>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-600 border-t pt-2">
                <p>ID: {recordModal.id}</p>
                <p>Fecha: {new Date(recordModal.fechaCreacion).toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="primary" className="flex-1" size="sm" onClick={() => { setRecordModal(null); handleEdit(recordModal); }}>
                  Editar
                </Button>
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => setRecordModal(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete All Confirmation Modal */}
        <Modal
          isOpen={showDeleteAllModal}
          onClose={() => setShowDeleteAllModal(false)}
          title="⚠️ Eliminar Todo"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar todos los {records.length} registros? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteAllModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteAll} loading={isLoading}>
                Eliminar Todo
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para crear nuevo proyecto */}
        <Modal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          title="✨ Crear Nuevo Proyecto"
          size="sm"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              label="Nombre del Proyecto"
              placeholder="ej: Proyecto Beta"
              value={newProjectData.name}
              onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
              disabled={isLoading}
              maxLength={50}
              required
            />

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Descripción (opcional)</label>
              <textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({...newProjectData, description: e.target.value})}
                placeholder="Descripción breve del proyecto..."
                disabled={isLoading}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none"
                rows={2}
                maxLength={100}
              />
            </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipos de Actores (Usuarios)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newActorInput}
                    onChange={(e) => setNewActorInput(e.target.value)}
                    placeholder="Ej: Cliente, Proveedor, Admin..."
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddActor()}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddActor}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProjectData.actors?.map((actor, idx) => (
                    <div key={idx} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                      {actor}
                      <button
                        type="button"
                        onClick={() => {
                          const newActors = newProjectData.actors.filter((_, i) => i !== idx);
                          setNewProjectData({...newProjectData, actors: newActors});
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Color Degradado</label>
              <select
                value={newProjectData.color}
                onChange={(e) => setNewProjectData({...newProjectData, color: e.target.value})}
                disabled={isLoading}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              >
                <option value="from-blue-500 to-cyan-500">Azul - Cian</option>
                <option value="from-purple-500 to-pink-500">Púrpura - Rosa</option>
                <option value="from-green-500 to-emerald-500">Verde - Menta</option>
                <option value="from-yellow-400 to-orange-500">Amarillo - Naranja</option>
                <option value="from-red-500 to-pink-500">Rojo - Rosa</option>
                <option value="from-indigo-500 to-blue-500">Índigo - Azul</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNewProjectModal(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button variant="success" className="flex-1" type="submit" disabled={isLoading || !newProjectData.name.trim()} loading={isLoading}>
                Crear Proyecto
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para editar proyecto */}
        <Modal
          isOpen={editingProjectId !== null}
          onClose={handleCancelProjectEdit}
          title="✏️ Editar Proyecto"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProjectEdit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Proyecto</label>
              <input
                type="text"
                value={editingProjectData.name}
                onChange={(e) => setEditingProjectData({ ...editingProjectData, name: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                placeholder="Nombre del proyecto..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Descripción (opcional)</label>
              <textarea
                value={editingProjectData.description}
                onChange={(e) => setEditingProjectData({ ...editingProjectData, description: e.target.value })}
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
                  placeholder="Ej: Cliente, Proveedor, Admin..."
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddActor()}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddActor}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingProjectData.actors?.map((actor, idx) => (
                  <div key={idx} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    {actor}
                    <button
                      type="button"
                      onClick={() => handleRemoveActor(idx)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="secondary" className="flex-1" type="button" onClick={handleCancelProjectEdit} disabled={isLoading}>
                Cancelar
              </Button>
              <Button variant="success" className="flex-1" type="submit" disabled={isLoading || !editingProjectData.name.trim()} loading={isLoading}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>

        {/* Footer */}
        <div className="mt-6 md:mt-8 text-center text-gray-700 text-xs md:text-sm font-semibold">
          QA Bug Tracker Dashboard • {new Date().getFullYear()}
        </div>
        </div>
      </div>
    </div>
  );
}
