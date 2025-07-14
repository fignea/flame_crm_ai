import React, { useEffect, useState } from 'react';
import { autoMessageScheduleApi } from '../services/api';
import { AutoMessageSchedule, AutoMessageScheduleCreateRequest } from '../types/api';
import { connectionService } from '../services/connectionService';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const defaultForm: AutoMessageScheduleCreateRequest = {
  connectionId: '',
  message: '',
  timeRanges: [{ from: '', to: '' }],
  daysOfWeek: [],
  isActive: true,
};

const weekDays = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<AutoMessageSchedule[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AutoMessageSchedule | null>(null);
  const [form, setForm] = useState<AutoMessageScheduleCreateRequest>(defaultForm);

  const loadConnections = async () => {
    try {
      const response = await connectionService.getAll();
      setConnections(response.data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Error al cargar las conexiones');
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await autoMessageScheduleApi.list();
      setSchedules(data);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar programaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadSchedules(); 
    loadConnections();
  }, []);

  const handleOpenModal = (schedule?: AutoMessageSchedule) => {
    if (schedule) {
      setEditing(schedule);
      setForm({
        connectionId: schedule.connectionId,
        message: schedule.message,
        timeRanges: schedule.timeRanges,
        daysOfWeek: schedule.daysOfWeek,
        isActive: schedule.isActive,
      });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      const checked = e.target.checked;
      setForm(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDayToggle = (day: number) => {
    setForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleTimeRangeChange = (idx: number, field: 'from' | 'to', value: string) => {
    setForm(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.map((tr, i) => i === idx ? { ...tr, [field]: value } : tr),
    }));
  };

  const handleAddTimeRange = () => {
    setForm(prev => ({ ...prev, timeRanges: [...prev.timeRanges, { from: '', to: '' }] }));
  };

  const handleRemoveTimeRange = (idx: number) => {
    setForm(prev => ({ ...prev, timeRanges: prev.timeRanges.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!form.connectionId) {
      toast.error('Debes seleccionar una conexión');
      return;
    }
    if (!form.message.trim()) {
      toast.error('El mensaje es requerido');
      return;
    }
    if (form.daysOfWeek.length === 0) {
      toast.error('Debes seleccionar al menos un día');
      return;
    }
    if (form.timeRanges.some(tr => !tr.from || !tr.to)) {
      toast.error('Todos los horarios deben estar completos');
      return;
    }

    try {
      if (editing) {
        await autoMessageScheduleApi.update(editing.id, form);
        toast.success('Programación actualizada');
      } else {
        await autoMessageScheduleApi.create(form);
        toast.success('Programación creada');
      }
      handleCloseModal();
      loadSchedules();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta programación?')) return;
    try {
      await autoMessageScheduleApi.remove(id);
      toast.success('Eliminada');
      loadSchedules();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  const handleToggleActive = async (schedule: AutoMessageSchedule) => {
    try {
      await autoMessageScheduleApi.setActive(schedule.id, !schedule.isActive);
      toast.success('Estado actualizado');
      loadSchedules();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programaciones Automáticas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona los mensajes automáticos por conexión y horario</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} /> Nueva Programación
        </button>
      </div>

      {/* Tabla de programaciones */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Conexión</th>
              <th className="px-4 py-2 text-left">Mensaje</th>
              <th className="px-4 py-2 text-left">Días</th>
              <th className="px-4 py-2 text-left">Horarios</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No hay programaciones</td></tr>
            ) : schedules.map(sch => {
              const connection = connections.find(c => c.id === sch.connectionId);
              return (
                <tr key={sch.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">
                    {connection ? connection.name : 'Conexión no encontrada'}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">{sch.message}</td>
                  <td className="px-4 py-2">
                    {sch.daysOfWeek.map(d => weekDays[d]).join(', ')}
                  </td>
                  <td className="px-4 py-2">
                    {sch.timeRanges.map((tr, i) => (
                      <span key={i} className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mr-1 text-xs">
                        {tr.from} - {tr.to}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleToggleActive(sch)} className="focus:outline-none">
                      {sch.isActive ? <CheckCircle className="text-green-500" /> : <XCircle className="text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleOpenModal(sch)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(sch.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de alta/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editing ? 'Editar Programación' : 'Nueva Programación'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Conexión</label>
                <select
                  name="connectionId"
                  value={form.connectionId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecciona una conexión</option>
                  {connections.map(conn => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  rows={3}
                  placeholder="Escribe el mensaje automático que se enviará..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Días de la semana</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((d, i) => (
                    <label key={i} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.daysOfWeek.includes(i)}
                        onChange={() => handleDayToggle(i)}
                        className="accent-blue-600"
                      />
                      <span>{d.slice(0,3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horarios</label>
                {form.timeRanges.map((tr, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-1">
                    <input
                      type="time"
                      value={tr.from}
                      onChange={e => handleTimeRangeChange(idx, 'from', e.target.value)}
                      className="border rounded p-1"
                      required
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={tr.to}
                      onChange={e => handleTimeRangeChange(idx, 'to', e.target.value)}
                      className="border rounded p-1"
                      required
                    />
                    {form.timeRanges.length > 1 && (
                      <button type="button" onClick={() => handleRemoveTimeRange(idx)} className="text-red-500"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddTimeRange} className="text-blue-600 mt-1">+ Agregar horario</button>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules; 