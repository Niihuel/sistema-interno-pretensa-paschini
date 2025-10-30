import { useMemo, useState, useEffect } from 'react';
import { HardDrive, FileCheck, Bell, FileType } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyBackupsApi } from '../../daily-backups/api/daily-backups.api';
import type {
  CreateBackupDiskPayload,
  UpdateBackupDiskPayload,
  CreateBackupStatusPayload,
  UpdateBackupStatusPayload,
  UpdateNotificationSettingPayload,
  CreateBackupFileTypePayload,
  UpdateBackupFileTypePayload,
} from '../../daily-backups/types';
import { useToast } from '../../../shared/components/ui/ToastContainer';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import Tabs from '../../../shared/components/ui/Tabs';
import Modal from '../../../shared/components/ui/Modal';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import Select from '../../../shared/components/ui/Select';

type TabId = 'disks' | 'statuses' | 'fileTypes' | 'notifications';

const TABS = [
  { id: 'disks' as TabId, label: 'Discos Físicos', icon: HardDrive },
  { id: 'statuses' as TabId, label: 'Estados de Archivos', icon: FileCheck },
  { id: 'fileTypes' as TabId, label: 'Tipos de Archivos', icon: FileType },
  { id: 'notifications' as TabId, label: 'Notificaciones', icon: Bell },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baja' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

interface EditableDisk extends CreateBackupDiskPayload {
  id?: number;
}

interface EditableStatus extends CreateBackupStatusPayload {
  id?: number;
}

interface EditableFileType extends CreateBackupFileTypePayload {
  id?: number;
}

const initialDiskForm: EditableDisk = {
  name: '',
  sequence: 1,
  color: '',
  description: '',
  isActive: true,
};

const initialStatusForm: EditableStatus = {
  code: '',
  label: '',
  sortOrder: 1,
  isFinal: false,
  isActive: true,
  color: '',
  description: '',
};

const initialFileTypeForm: EditableFileType = {
  code: '',
  name: '',
  sequence: 1,
  description: '',
  icon: '',
  isActive: true,
};

const normalizeSequence = (value: number | string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
};

export default function DailyBackupConfigTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('disks');

  // Modals state
  const [isDiskModalOpen, setIsDiskModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isFileTypeModalOpen, setIsFileTypeModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'disk' | 'status' | 'fileType'; id: number } | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['daily-backups', 'config'],
    queryFn: dailyBackupsApi.getConfig,
  });

  const [diskForm, setDiskForm] = useState<EditableDisk>(initialDiskForm);
  const [editingDiskId, setEditingDiskId] = useState<number | null>(null);

  const [statusForm, setStatusForm] = useState<EditableStatus>(initialStatusForm);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

  const [fileTypeForm, setFileTypeForm] = useState<EditableFileType>(initialFileTypeForm);
  const [editingFileTypeId, setEditingFileTypeId] = useState<number | null>(null);

  const [notificationEdits, setNotificationEdits] = useState<Record<
    string,
    UpdateNotificationSettingPayload
  >>({});

  // Computed values para FileTypes (movidos aquí para evitar hooks en funciones de render)
  const sortedFileTypes = useMemo(() => {
    if (!config?.fileTypes) return [];
    return [...config.fileTypes].sort((a, b) => a.sequence - b.sequence);
  }, [config?.fileTypes]);

  const nextAvailableFileTypeSequence = useMemo(() => {
    if (!config?.fileTypes || config.fileTypes.length === 0) return 1;
    const maxSequence = Math.max(...config.fileTypes.map((f) => f.sequence));
    return maxSequence + 1;
  }, [config?.fileTypes]);

  const invalidateConfig = () =>
    queryClient.invalidateQueries({ queryKey: ['daily-backups', 'config'] });

  // MUTATIONS
  const createDiskMutation = useMutation({
    mutationFn: (payload: CreateBackupDiskPayload) => dailyBackupsApi.createDisk(payload),
    onSuccess: () => {
      toast.success('Disco creado correctamente');
      invalidateConfig();
      setIsDiskModalOpen(false);
      setEditingDiskId(null);
      setDiskForm({ ...initialDiskForm, sequence: nextAvailableSequence });
    },
    onError: (error: any) => {
      console.error('Error al crear disco:', error);
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes('Unique constraint') || errorMessage?.includes('sequence')) {
        toast.error(`Ya existe un disco con la secuencia ${diskForm.sequence}`);
      } else {
        toast.error('No se pudo crear el disco');
      }
    },
  });

  const updateDiskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBackupDiskPayload }) =>
      dailyBackupsApi.updateDisk(id, data),
    onSuccess: () => {
      toast.success('Disco actualizado');
      invalidateConfig();
      setIsDiskModalOpen(false);
      setEditingDiskId(null);
      setDiskForm({ ...initialDiskForm, sequence: nextAvailableSequence });
    },
    onError: (error) => {
      console.error('Error al actualizar disco:', error);
      toast.error('No se pudo actualizar el disco');
    },
  });

  const deleteDiskMutation = useMutation({
    mutationFn: (id: number) => dailyBackupsApi.archiveDisk(id),
    onSuccess: () => {
      toast.success('Disco eliminado correctamente');
      invalidateConfig();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error al eliminar disco:', error);
      toast.error('No se pudo eliminar el disco');
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: (payload: CreateBackupStatusPayload) => dailyBackupsApi.createStatus(payload),
    onSuccess: () => {
      toast.success('Estado creado correctamente');
      invalidateConfig();
      setIsStatusModalOpen(false);
      setStatusForm(initialStatusForm);
    },
    onError: (error) => {
      console.error('Error al crear estado:', error);
      toast.error('No se pudo crear el estado');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBackupStatusPayload }) =>
      dailyBackupsApi.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidateConfig();
      setIsStatusModalOpen(false);
      setEditingStatusId(null);
      setStatusForm(initialStatusForm);
    },
    onError: (error) => {
      console.error('Error al actualizar estado:', error);
      toast.error('No se pudo actualizar el estado');
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: number) => dailyBackupsApi.archiveStatus(id),
    onSuccess: () => {
      toast.success('Estado eliminado correctamente');
      invalidateConfig();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error al eliminar estado:', error);
      toast.error('No se pudo eliminar el estado');
    },
  });

  const createFileTypeMutation = useMutation({
    mutationFn: (payload: CreateBackupFileTypePayload) => dailyBackupsApi.createFileType(payload),
    onSuccess: () => {
      toast.success('Tipo de archivo creado correctamente');
      invalidateConfig();
      setIsFileTypeModalOpen(false);
      setEditingFileTypeId(null);
      setFileTypeForm(initialFileTypeForm);
    },
    onError: (error) => {
      console.error('Error al crear tipo de archivo:', error);
      toast.error('No se pudo crear el tipo de archivo');
    },
  });

  const updateFileTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBackupFileTypePayload }) =>
      dailyBackupsApi.updateFileType(id, data),
    onSuccess: () => {
      toast.success('Tipo de archivo actualizado');
      invalidateConfig();
      setIsFileTypeModalOpen(false);
      setEditingFileTypeId(null);
      setFileTypeForm(initialFileTypeForm);
    },
    onError: (error) => {
      console.error('Error al actualizar tipo de archivo:', error);
      toast.error('No se pudo actualizar el tipo de archivo');
    },
  });

  const deleteFileTypeMutation = useMutation({
    mutationFn: (id: number) => dailyBackupsApi.archiveFileType(id),
    onSuccess: () => {
      toast.success('Tipo de archivo eliminado correctamente');
      invalidateConfig();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error al eliminar tipo de archivo:', error);
      toast.error('No se pudo eliminar el tipo de archivo');
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ code, data }: { code: string; data: UpdateNotificationSettingPayload }) =>
      dailyBackupsApi.updateNotificationSetting(code, data),
    onSuccess: () => {
      toast.success('Notificación actualizada');
      invalidateConfig();
    },
    onError: (error) => {
      console.error('Error al actualizar notificación:', error);
      toast.error('No se pudo actualizar la notificación');
    },
  });

  const sortedDisks = useMemo(
    () => (config?.disks ?? []).slice().sort((a, b) => a.sequence - b.sequence),
    [config?.disks],
  );

  const sortedStatuses = useMemo(
    () =>
      (config?.statuses ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [config?.statuses],
  );

  const nextAvailableSequence = useMemo(() => {
    if (!config?.disks || config.disks.length === 0) return 1;
    const maxSequence = Math.max(...config.disks.map((d) => d.sequence));
    return maxSequence + 1;
  }, [config?.disks]);

  // Update form sequence when not editing and available sequence changes
  useEffect(() => {
    if (!editingDiskId && nextAvailableSequence) {
      setDiskForm((prev) => ({ ...prev, sequence: nextAvailableSequence }));
    }
  }, [nextAvailableSequence, editingDiskId]);

  const handleDiskSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validación adicional
    if (!diskForm.name.trim()) {
      toast.error('El nombre del disco es obligatorio');
      return;
    }

    // Prevenir envíos duplicados
    if (createDiskMutation.isPending || updateDiskMutation.isPending) {
      return;
    }

    if (editingDiskId) {
      updateDiskMutation.mutate({
        id: editingDiskId,
        data: {
          name: diskForm.name.trim(),
          sequence: normalizeSequence(diskForm.sequence),
          color: diskForm.color || undefined,
          description: diskForm.description?.trim() || undefined,
          isActive: diskForm.isActive,
        },
      });
    } else {
      createDiskMutation.mutate({
        name: diskForm.name.trim(),
        sequence: normalizeSequence(diskForm.sequence),
        color: diskForm.color || undefined,
        description: diskForm.description?.trim() || undefined,
        isActive: diskForm.isActive,
      });
    }
  };

  const handleStatusSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CreateBackupStatusPayload = {
      code: statusForm.code.trim() || statusForm.label.trim().toUpperCase().replace(/\s+/g, '_'),
      label: statusForm.label,
      description: statusForm.description,
      color: statusForm.color,
      sortOrder: statusForm.sortOrder,
      isFinal: statusForm.isFinal,
      isActive: statusForm.isActive,
    };

    if (editingStatusId) {
      updateStatusMutation.mutate({ id: editingStatusId, data: payload });
    } else {
      createStatusMutation.mutate(payload);
    }
  };

  const handleNotificationSubmit = (code: string) => {
    const updates = notificationEdits[code];
    if (!updates) {
      toast.info('No hay cambios para guardar');
      return;
    }
    updateNotificationMutation.mutate({ code, data: updates });
    setNotificationEdits((prev) => {
      const newEdits = { ...prev };
      delete newEdits[code];
      return newEdits;
    });
  };

  const handleFileTypeSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!fileTypeForm.name.trim()) {
      toast.error('El nombre del tipo de archivo es obligatorio');
      return;
    }

    if (!fileTypeForm.code.trim()) {
      toast.error('El código es obligatorio');
      return;
    }

    if (createFileTypeMutation.isPending || updateFileTypeMutation.isPending) {
      return;
    }

    const payload: CreateBackupFileTypePayload = {
      code: fileTypeForm.code.trim().toUpperCase(),
      name: fileTypeForm.name.trim(),
      description: fileTypeForm.description?.trim() || undefined,
      sequence: normalizeSequence(fileTypeForm.sequence),
      icon: fileTypeForm.icon?.trim() || undefined,
      isActive: fileTypeForm.isActive,
    };

    if (editingFileTypeId) {
      updateFileTypeMutation.mutate({ id: editingFileTypeId, data: payload });
    } else {
      createFileTypeMutation.mutate(payload);
    }
  };

  const isBusy =
    createDiskMutation.isPending ||
    updateDiskMutation.isPending ||
    deleteDiskMutation.isPending ||
    createStatusMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteStatusMutation.isPending ||
    createFileTypeMutation.isPending ||
    updateFileTypeMutation.isPending ||
    deleteFileTypeMutation.isPending ||
    updateNotificationMutation.isPending;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white mb-2">Configuración de Backups Diarios</h1>
        <p className="text-white/60">
          Configura los discos de rotación, estados de archivos y notificaciones para el sistema de backups diarios.
        </p>
      </header>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={(tabId: string) => setActiveTab(tabId as TabId)} />

      <div className="min-h-[400px]">
        {activeTab === 'disks' && renderDisksTab()}
        {activeTab === 'statuses' && renderStatusesTab()}
        {activeTab === 'fileTypes' && renderFileTypesTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
      </div>

      {/* DISK MODAL */}
      <Modal
        isOpen={isDiskModalOpen}
        onClose={() => {
          setIsDiskModalOpen(false);
          setEditingDiskId(null);
          setDiskForm({ ...initialDiskForm, sequence: nextAvailableSequence });
        }}
        title={editingDiskId ? 'Editar Disco' : 'Nuevo Disco'}
      >
        <form onSubmit={handleDiskSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={diskForm.name}
            onChange={(e) => setDiskForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Disco Azul"
            required
          />
          <Input
            label="Secuencia"
            type="number"
            min={1}
            value={diskForm.sequence}
            onChange={(e) =>
              setDiskForm((prev) => ({ ...prev, sequence: normalizeSequence(e.target.value) }))
            }
            placeholder="1"
            required
          />
          <label className="flex flex-col gap-1 text-xs text-white/70">
            <span>Color (opcional)</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={diskForm.color || '#60a5fa'}
                onChange={(e) => setDiskForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <Input
                value={diskForm.color ?? ''}
                onChange={(e) => setDiskForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#60a5fa"
                className="flex-1"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/70">
            <span>Descripción</span>
            <textarea
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              value={diskForm.description ?? ''}
              onChange={(e) =>
                setDiskForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción adicional del disco"
              rows={3}
            />
          </label>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              id="disk-active"
              checked={diskForm.isActive}
              onChange={(e) => setDiskForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="disk-active">Disco activo en la rotación</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDiskModalOpen(false);
                setEditingDiskId(null);
                setDiskForm({ ...initialDiskForm, sequence: nextAvailableSequence });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {editingDiskId ? 'Guardar Cambios' : 'Crear Disco'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setEditingStatusId(null);
          setStatusForm(initialStatusForm);
        }}
        title={editingStatusId ? 'Editar Estado' : 'Nuevo Estado'}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <Input
            label="Etiqueta"
            value={statusForm.label}
            onChange={(e) => setStatusForm((prev) => ({ ...prev, label: e.target.value }))}
            placeholder="Ej: En Progreso"
            required
          />
          <Input
            label="Código (opcional)"
            value={statusForm.code}
            onChange={(e) => setStatusForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Se generará automáticamente si se deja vacío"
          />
          <Input
            label="Orden"
            type="number"
            min={1}
            value={statusForm.sortOrder}
            onChange={(e) => setStatusForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
            required
          />
          <label className="flex flex-col gap-1 text-xs text-white/70">
            <span>Color (opcional)</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={statusForm.color || '#60a5fa'}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <Input
                value={statusForm.color ?? ''}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#60a5fa"
                className="flex-1"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/70">
            <span>Descripción</span>
            <textarea
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              value={statusForm.description ?? ''}
              onChange={(e) =>
                setStatusForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción del estado"
              rows={3}
            />
          </label>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              id="status-final"
              checked={statusForm.isFinal}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, isFinal: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="status-final">Estado final (no permite cambios posteriores)</label>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              id="status-active"
              checked={statusForm.isActive}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="status-active">Estado activo</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsStatusModalOpen(false);
                setEditingStatusId(null);
                setStatusForm(initialStatusForm);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {editingStatusId ? 'Guardar Cambios' : 'Crear Estado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* FILE TYPE MODAL */}
      <Modal
        isOpen={isFileTypeModalOpen}
        onClose={() => {
          setIsFileTypeModalOpen(false);
          setEditingFileTypeId(null);
          setFileTypeForm(initialFileTypeForm);
        }}
        title={editingFileTypeId ? 'Editar Tipo de Archivo' : 'Nuevo Tipo de Archivo'}
      >
        <form onSubmit={handleFileTypeSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={fileTypeForm.name}
            onChange={(e) => setFileTypeForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Backup.zip"
            required
          />
          <Input
            label="Código"
            value={fileTypeForm.code}
            onChange={(e) => setFileTypeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Ej: BACKUP_ZIP"
            required
          />
          <Input
            label="Secuencia"
            type="number"
            min={1}
            value={fileTypeForm.sequence}
            onChange={(e) => setFileTypeForm((prev) => ({ ...prev, sequence: Number(e.target.value) }))}
            required
          />
          <Input
            label="Icono (opcional)"
            value={fileTypeForm.icon ?? ''}
            onChange={(e) => setFileTypeForm((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="Ej: Archive, Database, File"
          />
          <label className="flex flex-col gap-1 text-xs text-white/70">
            <span>Descripción</span>
            <textarea
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              value={fileTypeForm.description ?? ''}
              onChange={(e) =>
                setFileTypeForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción del tipo de archivo"
              rows={3}
            />
          </label>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              id="filetype-active"
              checked={fileTypeForm.isActive}
              onChange={(e) => setFileTypeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="filetype-active">Tipo de archivo activo</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsFileTypeModalOpen(false);
                setEditingFileTypeId(null);
                setFileTypeForm(initialFileTypeForm);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {editingFileTypeId ? 'Guardar Cambios' : 'Crear Tipo de Archivo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'disk') {
            deleteDiskMutation.mutate(deleteConfirm.id);
          } else if (deleteConfirm?.type === 'status') {
            deleteStatusMutation.mutate(deleteConfirm.id);
          } else if (deleteConfirm?.type === 'fileType') {
            deleteFileTypeMutation.mutate(deleteConfirm.id);
          }
        }}
        title={`Eliminar ${
          deleteConfirm?.type === 'disk' ? 'Disco' :
          deleteConfirm?.type === 'status' ? 'Estado' :
          'Tipo de Archivo'
        }`}
        message={`¿Estás seguro de que deseas eliminar este ${
          deleteConfirm?.type === 'disk' ? 'disco' :
          deleteConfirm?.type === 'status' ? 'estado' :
          'tipo de archivo'
        }? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );

  // RENDER FUNCTIONS
  function renderDisksTab() {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Discos Físicos</h2>
            <p className="text-sm text-white/60">
              Configura el número de discos rotativos y sus colores de referencia.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingDiskId(null);
              setDiskForm({ ...initialDiskForm, sequence: nextAvailableSequence });
              setIsDiskModalOpen(true);
            }}
          >
            Nuevo Disco
          </Button>
        </header>

        <div className="overflow-x-auto border border-white/10 rounded-lg">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase text-white/60">
              <tr>
                <th className="px-3 py-2 text-left">Secuencia</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-white/40">
                    Cargando configuración de discos...
                  </td>
                </tr>
              )}
              {!isLoading && sortedDisks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-white/40">
                    No hay discos configurados aún.
                  </td>
                </tr>
              )}
              {sortedDisks.map((disk) => (
                <tr key={disk.id}>
                  <td className="px-3 py-2">{disk.sequence}</td>
                  <td className="px-3 py-2 font-medium text-white">{disk.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{
                          backgroundColor: disk.color ?? 'transparent',
                          borderColor: disk.color ?? 'rgba(255,255,255,0.2)',
                        }}
                      />
                      <span className="text-white/60 text-xs">{disk.color || 'Sin color'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        disk.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {disk.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingDiskId(disk.id);
                        setDiskForm({
                          id: disk.id,
                          name: disk.name,
                          sequence: disk.sequence,
                          color: disk.color ?? '',
                          description: disk.description ?? '',
                          isActive: disk.isActive,
                        });
                        setIsDiskModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ type: 'disk', id: disk.id })}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderStatusesTab() {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Estados de Archivos</h2>
            <p className="text-sm text-white/60">
              Define los estados del ciclo de vida de los archivos de backup.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingStatusId(null);
              setStatusForm(initialStatusForm);
              setIsStatusModalOpen(true);
            }}
          >
            Nuevo Estado
          </Button>
        </header>

        <div className="overflow-x-auto border border-white/10 rounded-lg">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase text-white/60">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Etiqueta</th>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-left">Orden</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-white/40">
                    Cargando estados...
                  </td>
                </tr>
              )}
              {!isLoading && sortedStatuses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-white/40">
                    No hay estados configurados aún.
                  </td>
                </tr>
              )}
              {sortedStatuses.map((status) => (
                <tr key={status.id}>
                  <td className="px-3 py-2 font-mono text-xs">{status.code}</td>
                  <td className="px-3 py-2 font-medium text-white">{status.label}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{
                          backgroundColor: status.color ?? 'transparent',
                          borderColor: status.color ?? 'rgba(255,255,255,0.2)',
                        }}
                      />
                      <span className="text-white/60 text-xs">{status.color || 'Sin color'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{status.sortOrder}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        status.isFinal
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {status.isFinal ? 'Final' : 'Intermedio'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingStatusId(status.id);
                        setStatusForm({
                          code: status.code,
                          label: status.label,
                          description: status.description ?? '',
                          color: status.color ?? '',
                          sortOrder: status.sortOrder,
                          isFinal: status.isFinal,
                          isActive: status.isActive,
                        });
                        setIsStatusModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ type: 'status', id: status.id })}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderNotificationsTab() {
    if (!config?.notifications) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/40">
          No hay notificaciones configuradas.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {config.notifications.map((notification) => {
          const edits = notificationEdits[notification.code] || {};
          const currentEnabled = edits.isEnabled ?? notification.isEnabled;
          const currentPriority = edits.priority ?? notification.priority;
          const currentTitle = edits.title ?? notification.title;
          const currentMessage = edits.message ?? notification.message;
          const currentHour = edits.sendHour ?? notification.sendHour;
          const currentMinute = edits.sendMinute ?? notification.sendMinute;
          const hasChanges = Object.keys(edits).length > 0;

          const updateNotification = (updates: Partial<UpdateNotificationSettingPayload>) => {
            setNotificationEdits((prev) => ({
              ...prev,
              [notification.code]: { ...prev[notification.code], ...updates },
            }));
          };

          return (
            <div key={notification.code} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{notification.code}</h3>
                  <p className="text-sm text-white/60">Configuración de notificación automática</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`notif-${notification.code}`}
                    checked={currentEnabled}
                    onChange={(e) => updateNotification({ isEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor={`notif-${notification.code}`} className="text-sm text-white/70">
                    Activa
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Título"
                  value={currentTitle}
                  onChange={(e) => updateNotification({ title: e.target.value })}
                />

                <Select
                  label="Prioridad"
                  value={currentPriority}
                  onChange={(e) => updateNotification({ priority: e.target.value as any })}
                  options={PRIORITY_OPTIONS}
                />

                {notification.sendHour !== null && (
                  <>
                    <Input
                      label="Hora"
                      type="number"
                      min={0}
                      max={23}
                      value={currentHour ?? 0}
                      onChange={(e) => updateNotification({ sendHour: Number(e.target.value) })}
                    />
                    <Input
                      label="Minuto"
                      type="number"
                      min={0}
                      max={59}
                      value={currentMinute ?? 0}
                      onChange={(e) => updateNotification({ sendMinute: Number(e.target.value) })}
                    />
                  </>
                )}
              </div>

              <label className="flex flex-col gap-1 text-xs text-white/70 mt-4">
                <span>Mensaje</span>
                <textarea
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={currentMessage}
                  onChange={(e) => updateNotification({ message: e.target.value })}
                  rows={3}
                />
              </label>

              {hasChanges && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setNotificationEdits((prev) => {
                        const newEdits = { ...prev };
                        delete newEdits[notification.code];
                        return newEdits;
                      });
                    }}
                  >
                    Descartar
                  </Button>
                  <Button onClick={() => handleNotificationSubmit(notification.code)}>
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderFileTypesTab() {
    // Hooks ya están definidos al nivel del componente
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Tipos de Archivos</h2>
            <p className="text-sm text-white/60">
              Configura los tipos de archivos que se incluyen en los backups diarios.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingFileTypeId(null);
              setFileTypeForm({ ...initialFileTypeForm, sequence: nextAvailableFileTypeSequence });
              setIsFileTypeModalOpen(true);
            }}
          >
            Nuevo Tipo de Archivo
          </Button>
        </header>

        <div className="overflow-x-auto border border-white/10 rounded-lg">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase text-white/60">
              <tr>
                <th className="px-3 py-2 text-left">Secuencia</th>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Icono</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-white/40">
                    Cargando tipos de archivos...
                  </td>
                </tr>
              )}
              {!isLoading && sortedFileTypes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-white/40">
                    No hay tipos de archivos configurados aún.
                  </td>
                </tr>
              )}
              {sortedFileTypes.map((fileType) => (
                <tr key={fileType.id}>
                  <td className="px-3 py-2">{fileType.sequence}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fileType.code}</td>
                  <td className="px-3 py-2 font-medium text-white">{fileType.name}</td>
                  <td className="px-3 py-2 text-white/60 text-xs">{fileType.icon || 'Sin icono'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        fileType.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {fileType.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingFileTypeId(fileType.id);
                        setFileTypeForm({
                          id: fileType.id,
                          code: fileType.code,
                          name: fileType.name,
                          description: fileType.description ?? '',
                          sequence: fileType.sequence,
                          icon: fileType.icon ?? '',
                          isActive: fileType.isActive,
                        });
                        setIsFileTypeModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm({ type: 'fileType', id: fileType.id })}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
