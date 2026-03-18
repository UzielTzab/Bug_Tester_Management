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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [recordModal, setRecordModal] = useState<TestRecord | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
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
    evidencia: '',
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
      evidencia: '',
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
      setFormData((prev) => ({ ...prev, evidencia: result }));
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
            setFormData((prev) => ({ ...prev, evidencia: reader.result as string }));
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
      evidencia: record.evidencia || '',
      estado: record.estado || 'Pendiente',
      notasDev: record.notasDev || '',
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await fetch(`/api/records/${id}`, { method: 'DELETE' });
      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await fetch('/api/records', { method: 'DELETE' });
      fetchRecords();
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Error deleting all records:', error);
    }
  };

  const handleStatusChange = async (id: string, estado: Estado) => {
    try {
      await fetch(`/api/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      fetchRecords();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleExport = () => {
    downloadExcel(records);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🐛 Registro de Bugs - QA Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={records.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              📊 Exportar a Excel
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={records.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              🗑️ Eliminar Todo
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              {showForm ? '✕ Cerrar' : '+ Nuevo Bug'}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8" onPaste={handlePaste}>
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Bug/Observación' : 'Registrar Nuevo Bug/Observación'}
            </h2>
            <p className="text-gray-400 text-sm mb-4">Todos los campos son opcionales. Puedes pegar imágenes directamente (Ctrl+V).</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Actor / Tipo Usuario</label>
                <select
                  value={formData.actor}
                  onChange={(e) => setFormData({ ...formData, actor: e.target.value as Actor })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACTORES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Módulo / Página</label>
                <input
                  type="text"
                  value={formData.modulo}
                  onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Login, Dashboard..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Error</label>
                <select
                  value={formData.tipoError}
                  onChange={(e) => setFormData({ ...formData, tipoError: e.target.value as TipoError })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_ERROR.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dispositivo</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value as DeviceType })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DISPOSITIVOS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Título del Error / Observación</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción breve del bug u observación"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as Estado })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              {/* Removed: Pasos para Reproducir, Resultado Esperado, Resultado Actual, Resolución (opcional) per request */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Evidencia (Imagen/Link)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.evidencia.startsWith('data:') ? 'Imagen cargada' : formData.evidencia}
                    onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL o pega imagen (Ctrl+V)"
                    readOnly={formData.evidencia.startsWith('data:')}
                  />
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
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
                    title="Subir imagen"
                  >
                    📷
                  </button>
                  {formData.evidencia && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, evidencia: '' })}
                      className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {formData.evidencia && isImageData(formData.evidencia) && (
                  <div className="mt-2">
                    <img
                      src={formData.evidencia}
                      alt="Vista previa"
                      className="max-h-32 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80"
                      onClick={() => setImageModal(formData.evidencia)}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas Dev</label>
                <textarea
                  value={formData.notasDev}
                  onChange={(e) => setFormData({ ...formData, notasDev: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas para desarrollo..."
                />
              </div>
              <div className="md:col-span-3 flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{records.length}</div>
            <div className="text-gray-400">Total Bugs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {records.filter((r) => r.estado === 'Pendiente').length}
            </div>
            <div className="text-gray-400">Pendientes</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">
              {records.filter((r) => r.estado === 'En Progreso').length}
            </div>
            <div className="text-gray-400">En Progreso</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-500">
              {records.filter((r) => r.estado === 'Corregido').length}
            </div>
            <div className="text-gray-400">Corregidos</div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {records.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12 bg-gray-800 rounded-lg">
              No hay registros. ¡Haz clic en "Nuevo Bug" para empezar!
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className={`relative flex flex-col bg-gray-800 rounded-xl shadow-lg p-4 hover:ring-2 hover:ring-blue-500 transition cursor-pointer min-h-[220px]`}
                onClick={() => setRecordModal(record)}
              >
                {/* Estado badge */}
                <span className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${estadoColors[record.estado || 'Pendiente']}`}>{record.estado}</span>

                {/* Imagen evidencia */}
                <div className="flex justify-center items-center mb-3 h-24">
                  {record.evidencia ? (
                    isImageData(record.evidencia) ? (
                      <img
                        src={record.evidencia}
                        alt="Evidencia"
                        className="h-20 w-20 object-cover rounded border border-gray-600 shadow cursor-pointer hover:opacity-80"
                        onClick={e => { e.stopPropagation(); setImageModal(record.evidencia); }}
                        title="Clic para ver en grande"
                      />
                    ) : (
                      <a
                        href={record.evidencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        Ver link
                      </a>
                    )
                  ) : (
                    <span className="text-gray-500 text-xs">Sin evidencia</span>
                  )}
                </div>

                {/* Título */}
                <div className="font-bold text-lg mb-1 truncate" title={record.titulo || ''}>
                  {record.titulo || '-'}
                </div>

                {/* Info principal */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {record.tipoError && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${tipoColors[record.tipoError]}`}>{record.tipoError}</span>
                  )}
                  {record.device && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium flex items-center gap-1">
                      {record.device === 'Mobile' ? '📱' : '💻'} {record.device}
                    </span>
                  )}
                  {record.actor && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${actorColors[record.actor] || 'bg-gray-500'}`}>{record.actor}</span>
                  )}
                </div>

                {/* Módulo */}
                <div className="text-xs text-gray-400 mb-2 truncate" title={record.modulo || ''}>
                  {record.modulo || '-'}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={e => { e.stopPropagation(); handleEdit(record); }}
                    className="text-blue-400 hover:text-blue-300 text-lg"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(record.id); }}
                    className="text-red-400 hover:text-red-300 text-lg"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                  <select
                    value={record.estado || 'Pendiente'}
                    onChange={e => { e.stopPropagation(); handleStatusChange(record.id, e.target.value as Estado); }}
                    className={`ml-auto px-2 py-1 rounded text-xs font-medium ${estadoColors[record.estado || 'Pendiente']} border-0 cursor-pointer bg-transparent`}
                    title="Cambiar estado"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e} className="bg-gray-800 text-white">{e}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Image Modal */}
        {imageModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
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
            onClick={() => setRecordModal(null)}
          >
            <div
              className="relative w-full max-w-lg sm:max-w-2xl bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-8 text-white flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Cerrar botón flotante */}
              <button
                onClick={() => setRecordModal(null)}
                className="absolute top-3 right-3 text-gray-300 hover:text-white text-2xl font-bold focus:outline-none"
                aria-label="Cerrar"
              >
                ×
              </button>

              {/* Imagen evidencia */}
              <div className="flex justify-center items-center mb-2">
                {recordModal.evidencia && isImageData(recordModal.evidencia) ? (
                  <img
                    src={recordModal.evidencia}
                    alt="Evidencia"
                    className="max-h-40 sm:max-h-60 rounded-lg border border-gray-700 shadow cursor-pointer hover:opacity-90"
                    onClick={() => setImageModal(recordModal.evidencia)}
                  />
                ) : recordModal.evidencia ? (
                  <a
                    href={recordModal.evidencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Abrir link de evidencia
                  </a>
                ) : (
                  <span className="text-gray-500 text-xs">Sin evidencia</span>
                )}
              </div>

              {/* Título y estado */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-xl sm:text-2xl font-bold truncate" title={recordModal.titulo || ''}>
                  {recordModal.titulo || recordModal.id}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${estadoColors[recordModal.estado || 'Pendiente']}`}>{recordModal.estado}</span>
              </div>

              {/* Info principal */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded">
                  <span className="font-semibold">ID:</span> <span className="font-mono">{recordModal.id}</span>
                </span>
                {recordModal.tipoError && (
                  <span className={`px-2 py-1 rounded font-medium ${tipoColors[recordModal.tipoError]}`}>{recordModal.tipoError}</span>
                )}
                {recordModal.device && (
                  <span className="px-2 py-1 bg-gray-700 rounded font-medium flex items-center gap-1">
                    {recordModal.device === 'Mobile' ? '📱' : '💻'} {recordModal.device}
                  </span>
                )}
                {recordModal.actor && (
                  <span className={`px-2 py-1 rounded font-medium ${actorColors[recordModal.actor] || 'bg-gray-500'}`}>{recordModal.actor}</span>
                )}
                {recordModal.modulo && (
                  <span className="px-2 py-1 bg-gray-800 rounded">{recordModal.modulo}</span>
                )}
                <span className="px-2 py-1 bg-gray-800 rounded">{new Date(recordModal.fechaCreacion).toLocaleString()}</span>
              </div>

              {/* Notas Dev */}
              <div>
                <h4 className="text-sm text-gray-300 font-semibold mb-1">Notas Dev</h4>
                <div className="p-3 bg-gray-800 rounded text-sm min-h-[40px] whitespace-pre-line">
                  {recordModal.notasDev || <span className="text-gray-500">Sin notas</span>}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 justify-end">
                <button
                  onClick={() => { setRecordModal(null); handleEdit(recordModal); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => setRecordModal(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteAllModal(false)}
          >
            <div
              className="bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-red-500">⚠️ Eliminar Todo</h3>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar todos los registros ({records.length} en total)? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
                >
                  Sí, Eliminar Todo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          QA Bug Tracker Dashboard • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
