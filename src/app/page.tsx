'use client';

import { useState, useEffect, useRef, type ChangeEvent, type ClipboardEvent, type FormEvent } from 'react';
import { TestRecord, TipoError, Estado, Actor, DeviceType } from '@/types';
import { downloadExcel } from '@/lib/excel';

const TIPOS_ERROR: TipoError[] = ['Diseño', 'Funcionalidad', 'Rendimiento', 'Seguridad'];
const ESTADOS: Estado[] = ['Pendiente', 'En Progreso', 'Corregido', 'No es un Error'];
const ACTORES: Actor[] = ['Invitado', 'Admin', 'Super Admin'];
const DISPOSITIVOS: DeviceType[] = ['Mobile', 'Desktop'];

const tipoColors: Record<TipoError, string> = {
  'Diseño': 'bg-pink-600 text-white',
  'Funcionalidad': 'bg-red-600 text-white',
  'Rendimiento': 'bg-yellow-500 text-black',
  'Seguridad': 'bg-purple-600 text-white',
};

const estadoColors: Record<Estado, string> = {
  'Pendiente': 'bg-gray-500 text-white',
  'En Progreso': 'bg-blue-600 text-white',
  'Corregido': 'bg-green-600 text-white',
  'No es un Error': 'bg-purple-600 text-white',
};

const actorColors: Record<Actor, string> = {
  'Invitado': 'bg-slate-500 text-white',
  'Admin': 'bg-indigo-500 text-white',
  'Super Admin': 'bg-pink-600 text-white',
};

export default function Dashboard() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [recordModal, setRecordModal] = useState<TestRecord | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Estado | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    actor: 'Invitado' as Actor,
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
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      const sortedData = (data || []).sort((a: TestRecord, b: TestRecord) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      setRecords(sortedData);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      actor: 'Invitado',
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const payload = { ...formData } as any;
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
      actor: record.actor || 'Invitado',
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
      fetchRecords();
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
      fetchRecords();
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

  const handleExport = () => {
    downloadExcel(records);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl font-bold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-indigo-200 to-purple-200 p-6 rounded-2xl border-4 border-gray-800 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">🐛 Registro de Bugs - QA Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={records.length === 0 || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-green-300 to-emerald-300 hover:from-green-400 hover:to-emerald-400 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-bold text-green-900 disabled:text-gray-700 border-2 border-gray-800 transition shadow-md"
            >
              📊 Exportar a Excel
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={records.length === 0 || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-red-300 to-orange-300 hover:from-red-400 hover:to-orange-400 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-bold text-red-900 disabled:text-gray-700 border-2 border-gray-800 transition shadow-md"
            >
              🗑️ Eliminar Todo
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-bold text-blue-900 disabled:text-gray-700 border-2 border-gray-800 transition shadow-md"
            >
              {showForm ? '✕ Cerrar' : '+ Nuevo Bug'}
            </button>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 bg-gradient-to-r from-teal-100 to-cyan-100 p-4 rounded-2xl border-4 border-gray-800 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscador */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">🔍 Buscar</label>
              <input
                type="text"
                placeholder="Buscar por título, módulo, tipo de error, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium placeholder-gray-600"
              />
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">🏷️ Filtrar por Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Estado | 'Todos')}
                className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
              >
                <option value="Todos">Todos</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Mostrar cantidad de resultados */}
          <div className="mt-3 text-sm font-semibold text-gray-900">
            Mostrando {getFilteredRecords().length} de {records.length} registros
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            <div
              className="relative w-full max-w-lg sm:max-w-2xl bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl shadow-2xl p-4 sm:p-8 text-gray-900 border-4 border-gray-800 my-8"
              onClick={e => e.stopPropagation()}
              onPaste={handlePaste}
            >
              {/* Cerrar botón flotante */}
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-2xl font-bold focus:outline-none"
                aria-label="Cerrar"
              >
                ×
              </button>

              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 pr-6">
                {editingId ? 'Editar Bug/Observación' : 'Registrar Nuevo Bug/Observación'}
              </h2>
              <p className="text-gray-700 text-sm mb-4 font-medium">Todos los campos son opcionales. Puedes pegar imágenes directamente (Ctrl+V).</p>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Actor / Tipo Usuario</label>
                  <select
                    value={formData.actor}
                  onChange={(e) => setFormData({ ...formData, actor: e.target.value as Actor })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                >
                  {ACTORES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Módulo / Página</label>
                <input
                  type="text"
                  value={formData.modulo}
                  onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                  placeholder="Ej: Login, Dashboard..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Tipo de Error</label>
                <select
                  value={formData.tipoError}
                  onChange={(e) => setFormData({ ...formData, tipoError: e.target.value as TipoError })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                >
                  {TIPOS_ERROR.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Dispositivo</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value as DeviceType })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                >
                  {DISPOSITIVOS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-gray-900 mb-1">Título del Error / Observación</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                  placeholder="Descripción breve del bug u observación"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as Estado })}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              {/* Removed: Pasos para Reproducir, Resultado Esperado, Resultado Actual, Resolución (opcional) per request */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-1">Evidencia (Imágenes/Links)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gradient-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 rounded-lg transition font-bold text-gray-900 border-2 border-gray-800 shadow-md"
                    title="Subir imagen"
                  >
                    📷 Agregar Imagen
                  </button>
                  <span className="text-gray-900 text-sm self-center font-medium">
                    {formData.evidencia.length > 0 && `(${formData.evidencia.length} imagen${formData.evidencia.length !== 1 ? 'es' : ''})`}
                  </span>
                </div>
                {formData.evidencia.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.evidencia.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border-2 border-gray-800 cursor-pointer hover:opacity-80"
                          onClick={() => setImageModal(img)}
                          title="Clic para ver en grande"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, evidencia: formData.evidencia.filter((_, i) => i !== idx) })}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition border border-gray-800"
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">📝 Notas Dev</label>
                <textarea
                  value={formData.notasDev}
                  onChange={(e) => setFormData({ ...formData, notasDev: e.target.value })}
                  rows={2}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900 font-medium"
                  placeholder="Notas para desarrollo..."
                />
              </div>
              <div className="md:col-span-3 flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg font-bold text-green-900 disabled:text-gray-700 border-2 border-gray-800 transition shadow-md flex items-center gap-2 justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : editingId ? (
                    '💾 Actualizar'
                  ) : (
                    '➕ Guardar'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg font-bold text-gray-900 border-2 border-gray-800 transition shadow-md"
                >
                  ✕ Cancelar
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl p-4 text-center border-3 border-gray-800 shadow-md">
            <div className="text-3xl font-bold text-gray-900">{records.length}</div>
            <div className="text-gray-700 font-semibold">Total Bugs</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-4 text-center border-3 border-gray-800 shadow-md">
            <div className="text-3xl font-bold text-amber-900">
              {records.filter((r) => r.estado === 'Pendiente').length}
            </div>
            <div className="text-gray-700 font-semibold">Pendientes</div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4 text-center border-3 border-gray-800 shadow-md">
            <div className="text-3xl font-bold text-blue-900">
              {records.filter((r) => r.estado === 'En Progreso').length}
            </div>
            <div className="text-gray-700 font-semibold">En Progreso</div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 text-center border-3 border-gray-800 shadow-md">
            <div className="text-3xl font-bold text-green-900">
              {records.filter((r) => r.estado === 'Corregido').length}
            </div>
            <div className="text-gray-700 font-semibold">Corregidos</div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {getFilteredRecords().length === 0 ? (
            <div className="col-span-full text-center text-gray-900 font-bold py-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border-4 border-gray-800 shadow-lg">
              {records.length === 0 ? 'No hay registros. ¡Haz clic en "Nuevo Bug" para empezar!' : 'No se encontraron registros con los filtros aplicados.'}
            </div>
          ) : (
            getFilteredRecords().map((record) => {
              // Determine card background color based on tipo de error
              const getCardBg = () => {
                switch(record.tipoError) {
                  case 'Diseño': return 'from-pink-100 to-rose-100';
                  case 'Funcionalidad': return 'from-red-100 to-orange-100';
                  case 'Rendimiento': return 'from-yellow-100 to-amber-100';
                  case 'Seguridad': return 'from-purple-100 to-violet-100';
                  default: return 'from-blue-100 to-cyan-100';
                }
              };
              
              const getTextColor = () => {
                switch(record.tipoError) {
                  case 'Diseño': return 'text-pink-900';
                  case 'Funcionalidad': return 'text-red-900';
                  case 'Rendimiento': return 'text-amber-900';
                  case 'Seguridad': return 'text-purple-900';
                  default: return 'text-blue-900';
                }
              };

              return (
                <div
                  key={record.id}
                  className={`relative flex flex-col bg-gradient-to-br ${getCardBg()} rounded-2xl shadow-lg p-4 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer min-h-[240px] border-3 border-gray-800`}
                  onClick={() => setRecordModal(record)}
                >
                  {/* Estado badge */}
                  <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${estadoColors[record.estado || 'Pendiente']} shadow-md border border-gray-700`}>{record.estado}</span>

                  {/* Imagen evidencia */}
                  <div className="flex justify-center items-center mb-3 h-24 bg-white bg-opacity-60 rounded-xl border-2 border-gray-800">
                    {record.evidencia && record.evidencia.length > 0 ? (
                      record.evidencia[0] && isImageData(record.evidencia[0]) ? (
                        <div className="relative">
                          <img
                            src={record.evidencia[0]}
                            alt="Evidencia"
                            className="h-20 w-20 object-cover rounded-lg border-2 border-gray-800 shadow-md cursor-pointer hover:opacity-80 transition"
                            onClick={e => { e.stopPropagation(); setImageModal(record.evidencia[0]); }}
                            title="Clic para ver en grande"
                          />
                          {record.evidencia.length > 1 && (
                            <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border border-gray-800 shadow-md">
                              +{record.evidencia.length - 1}
                            </span>
                          )}
                        </div>
                      ) : record.evidencia[0] ? (
                        <a
                          href={record.evidencia[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 text-xs font-semibold underline"
                          onClick={e => e.stopPropagation()}
                        >
                          Ver link
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs font-medium">Sin evidencia</span>
                      )
                    ) : (
                      <span className="text-gray-600 text-xs font-medium">Sin evidencia</span>
                    )}
                  </div>

                  {/* Título */}
                  <div className={`font-bold text-base mb-2 truncate ${getTextColor()}`} title={record.titulo || ''}>
                    {record.titulo || '-'}
                  </div>

                  {/* Info principal */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {record.tipoError && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${tipoColors[record.tipoError]} border border-gray-700`}>{record.tipoError}</span>
                    )}
                    {record.device && (
                      <span className="px-2 py-1 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full text-xs font-bold text-gray-900 border border-gray-700 flex items-center gap-1">
                        {record.device === 'Mobile' ? '📱' : '💻'} {record.device}
                      </span>
                    )}
                  </div>

                  {/* Actor */}
                  {record.actor && (
                    <div className="text-xs font-semibold mb-1">
                      <span className={`px-2 py-1 rounded-full ${actorColors[record.actor] || 'bg-gray-500'} border border-gray-700`}>{record.actor}</span>
                    </div>
                  )}

                  {/* Módulo */}
                  <div className={`text-xs font-medium mb-3 truncate ${getTextColor()}`} title={record.modulo || ''}>
                    📁 {record.modulo || '-'}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 mt-auto pt-2 border-t-2 border-gray-800">
                    <button
                      onClick={e => { e.stopPropagation(); handleEdit(record); }}
                      disabled={isLoading}
                      className="text-lg hover:text-2xl transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(record.id); }}
                      disabled={isLoading}
                      className="text-lg hover:text-2xl transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                    <select
                      value={record.estado || 'Pendiente'}
                      onChange={e => { e.stopPropagation(); handleStatusChange(record.id, e.target.value as Estado); }}
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      disabled={isLoading}
                      className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${estadoColors[record.estado || 'Pendiente']} border-2 border-gray-800 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Cambiar estado"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e} className="bg-white text-gray-900">{e}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Image Modal */}
        {imageModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
            onClick={() => setImageModal(null)}
          >
            <div className="relative max-w-4xl max-h-full">
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

        {/* Record Details Modal - Mejorado y responsivo */}
        {recordModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => !isLoading && setRecordModal(null)}
          >
            <div
              className="relative w-full max-w-lg sm:max-w-2xl bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl shadow-2xl p-4 sm:p-8 text-gray-900 flex flex-col gap-4 border-4 border-gray-800"
              onClick={e => e.stopPropagation()}
            >
              {/* Cerrar botón flotante */}
              <button
                onClick={() => {
                  setRecordModal(null);
                  setExpandedNotes(false);
                  setExpandedTitle(false);
                }}
                disabled={isLoading}
                className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-2xl font-bold focus:outline-none disabled:opacity-50"
                aria-label="Cerrar"
              >
                ×
              </button>

              {/* Imagen evidencia */}
              <div className="flex flex-col justify-center items-center mb-2">
                {recordModal.evidencia && (Array.isArray(recordModal.evidencia) ? recordModal.evidencia.length > 0 : recordModal.evidencia) ? (
                  <>
                    {/* Imágenes */}
                    {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia]).some(e => isImageData(e)) && (
                      <div>
                        <h4 className="text-sm text-gray-900 font-bold mb-2">🖼️ Imágenes</h4>
                        <div className="flex gap-2 w-full mb-3 overflow-x-auto pb-2">
                          {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia])
                            .filter(img => isImageData(img))
                            .map((img, idx) => (
                              <div key={idx} className="flex-shrink-0">
                                <img
                                  src={img}
                                  alt={`Evidencia ${idx + 1}`}
                                  className="h-40 rounded-lg border-2 border-gray-800 shadow cursor-pointer hover:opacity-90 object-cover"
                                  onClick={() => setImageModal(img)}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* URLs */}
                    {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia]).some(e => typeof e === 'string' && (e.startsWith('http') || e.startsWith('https'))) && (
                      <div className="w-full">
                        <h4 className="text-sm text-gray-900 font-bold mb-2">🔗 Enlaces / URLs</h4>
                        <div className="flex flex-col gap-2">
                          {(Array.isArray(recordModal.evidencia) ? recordModal.evidencia : [recordModal.evidencia])
                            .filter(e => typeof e === 'string' && (e.startsWith('http') || e.startsWith('https')))
                            .map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-blue-100 p-3 rounded-lg border-2 border-gray-800">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:text-blue-900 text-xs font-bold underline break-words flex-1"
                                  title={url}
                                >
                                  {url.length > 60 ? url.substring(0, 60) + '...' : url}
                                </a>
                                <button
                                  onClick={() => handleCopyToClipboard(url)}
                                  className="px-3 py-1 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 rounded-lg text-xs font-bold text-gray-900 border-2 border-gray-800 transition whitespace-nowrap flex-shrink-0"
                                  title="Copiar al portapapeles"
                                >
                                  {copiedUrl === url ? '✓ Copiado' : '📋'}
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-600 text-xs font-medium">Sin evidencia</span>
                )}
              </div>

              {/* Título y estado */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-3xl font-bold whitespace-normal break-words" title={recordModal.titulo || ''}>
                    {recordModal.titulo || recordModal.id}
                  </h3>
                </div>
                <select
                  value={recordModal.estado || 'Pendiente'}
                  onChange={e => {
                    handleStatusChange(recordModal.id, e.target.value as Estado);
                    if (recordModal) {
                      setRecordModal({ ...recordModal, estado: e.target.value as Estado });
                    }
                  }}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-full text-xs font-bold ${estadoColors[recordModal.estado || 'Pendiente']} border-2 border-gray-800 cursor-pointer shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Cambiar estado"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e} className="bg-white text-gray-900">{e}</option>
                  ))}
                </select>
              </div>

              {/* Info principal */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-300 rounded-full font-semibold text-gray-900 border border-gray-800">
                  ID: <span className="font-mono">{recordModal.id}</span>
                </span>
                {recordModal.tipoError && (
                  <span className={`px-2 py-1 rounded-full font-bold border border-gray-800 ${tipoColors[recordModal.tipoError]}`}>{recordModal.tipoError}</span>
                )}
                {recordModal.device && (
                  <span className="px-2 py-1 bg-slate-300 rounded-full font-bold text-gray-900 border border-gray-800 flex items-center gap-1">
                    {recordModal.device === 'Mobile' ? '📱' : '💻'} {recordModal.device}
                  </span>
                )}
                {recordModal.actor && (
                  <span className={`px-2 py-1 rounded-full font-bold border border-gray-800 ${actorColors[recordModal.actor] || 'bg-gray-500'}`}>{recordModal.actor}</span>
                )}
                {recordModal.modulo && (
                  <span className="px-2 py-1 bg-slate-300 rounded-full font-bold text-gray-900 border border-gray-800">📁 {recordModal.modulo}</span>
                )}
                <span className="px-2 py-1 bg-slate-300 rounded-full font-bold text-gray-900 border border-gray-800">📅 {new Date(recordModal.fechaCreacion).toLocaleString()}</span>
              </div>

              {/* Notas Dev */}
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedNotes(!expandedNotes)}
              >
                <h4 className="text-sm text-gray-900 font-bold mb-1">📝 Notas Dev</h4>
                <div className={`p-3 bg-white bg-opacity-70 rounded-lg text-sm border-2 border-gray-800 text-gray-900 font-medium transition-all duration-300 ${
                  expandedNotes ? 'max-h-[500px] overflow-y-auto' : 'max-h-[80px] overflow-hidden'
                }`}>
                  {recordModal.notasDev || <span className="text-gray-600 italic">Sin notas</span>}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 justify-end pt-2 border-t-2 border-gray-800">
                <button
                  onClick={() => { setRecordModal(null); handleEdit(recordModal); }}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-200 to-cyan-200 hover:from-blue-300 hover:to-cyan-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-gray-900 border-2 border-gray-800 transition shadow-md"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    setRecordModal(null);
                    setExpandedNotes(false);
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-slate-200 to-gray-200 hover:from-slate-300 hover:to-gray-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-gray-900 border-2 border-gray-800 transition shadow-md"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => !isLoading && setShowDeleteAllModal(false)}
          >
            <div
              className="bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl shadow-2xl p-6 sm:p-8 text-gray-900 max-w-md w-full border-4 border-gray-800"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-red-900">⚠️ Eliminar Todo</h3>
              <p className="text-gray-800 mb-6 font-medium">
                ¿Estás seguro de que deseas eliminar todos los registros ({records.length} en total)? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg font-bold text-gray-900 border-2 border-gray-800 transition shadow-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg font-bold text-white disabled:text-gray-700 border-2 border-gray-800 transition shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Sí, Eliminar Todo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-700 text-sm font-semibold">
          QA Bug Tracker Dashboard • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
