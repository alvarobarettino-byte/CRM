import { useState, useEffect } from 'react';
import { X, Building2, User, Mail, DollarSign, TrendingUp, Tag, FileText, AlertCircle } from 'lucide-react';
import type { Deal, Priority, StageId } from '../types';
import { STAGES, SECTORS } from '../data/stages';

interface DealModalProps {
  deal?: Deal | null;
  initialStageId?: StageId;
  onSave: (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const TEAM_MEMBERS = ['Ana López', 'Miguel Torres', 'Carlos Vera', 'Laura Martín', 'Pedro Sanz'];

interface FormState {
  company: string;
  sector: string;
  dealSize: string;
  evEbitda: string;
  contactName: string;
  contactEmail: string;
  assignedTo: string;
  priority: Priority;
  stageId: StageId;
  notes: string;
  tags: string[];
}

const emptyForm = (stageId: StageId = 'identificacion'): FormState => ({
  company: '',
  sector: 'Tecnología',
  dealSize: '',
  evEbitda: '',
  contactName: '',
  contactEmail: '',
  assignedTo: TEAM_MEMBERS[0],
  priority: 'Media',
  stageId,
  notes: '',
  tags: [],
});

export function DealModal({ deal, initialStageId, onSave, onClose }: DealModalProps) {
  const [form, setForm] = useState<FormState>(deal ? {
    ...deal,
    dealSize: deal.dealSize != null ? String(deal.dealSize) : '',
    evEbitda: deal.evEbitda != null ? String(deal.evEbitda) : '',
    tags: deal.tags ?? [],
  } : emptyForm(initialStageId));
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = 'Nombre requerido';
    if (!form.contactName.trim()) errs.contactName = 'Contacto requerido';
    if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) {
      errs.contactEmail = 'Email inválido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      dealSize: form.dealSize === '' ? null : Number(form.dealSize),
      evEbitda: form.evEbitda === '' ? null : Number(form.evEbitda),
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const priorityColors: Record<Priority, string> = {
    Alta: 'bg-red-100 text-red-700 border-red-200',
    Media: 'bg-amber-100 text-amber-700 border-amber-200',
    Baja: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {deal ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {deal ? `Editando: ${deal.company}` : 'Introduce los datos del deal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company & Sector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 size={13} className="inline mr-1 text-slate-400" />
                Empresa *
              </label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Nombre de la empresa"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${errors.company ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.company && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.company}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sector</label>
              <select
                value={form.sector}
                onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
              >
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Deal Size & EV/EBITDA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <DollarSign size={13} className="inline mr-1 text-slate-400" />
                Tamaño del deal (€M)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.dealSize}
                onChange={e => setForm(f => ({ ...f, dealSize: e.target.value }))}
                placeholder="ej. 50"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <TrendingUp size={13} className="inline mr-1 text-slate-400" />
                EV/EBITDA (x)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.evEbitda}
                onChange={e => setForm(f => ({ ...f, evEbitda: e.target.value }))}
                placeholder="ej. 10.5"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <User size={13} className="inline mr-1 text-slate-400" />
                Contacto *
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="Nombre del contacto"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${errors.contactName ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.contactName && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.contactName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Mail size={13} className="inline mr-1 text-slate-400" />
                Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="email@empresa.com"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.contactEmail}
                </p>
              )}
            </div>
          </div>

          {/* Stage, Priority, Assigned */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Etapa</label>
              <select
                value={form.stageId}
                onChange={e => setForm(f => ({ ...f, stageId: e.target.value as StageId }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
              >
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad</label>
              <div className="flex gap-1">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${form.priority === p ? priorityColors[p] : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsable</label>
              <select
                value={form.assignedTo}
                onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
              >
                {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Tag size={13} className="inline mr-1 text-slate-400" />
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Añadir etiqueta..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <FileText size={13} className="inline mr-1 text-slate-400" />
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones, próximos pasos, contexto..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {deal ? 'Guardar cambios' : 'Crear deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
