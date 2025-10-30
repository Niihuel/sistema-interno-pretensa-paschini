import { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import Button from '../../../shared/components/ui/Button'
import { useCreateEvent, useUpdateEvent } from '../hooks/useCalendar'
import { useInventory } from '../../inventory/hooks/useInventory'
import type { CalendarEvent, NotificationPriority, EventFormData, EventCategory } from '../types'
import { cn } from '../../../shared/utils/cn'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialDate?: Date
  event?: CalendarEvent | null
}

const categoryOptions = [
  { value: 'OTHER', label: 'Otro' },
  { value: 'MEETING', label: 'Reunión' },
  { value: 'URGENT', label: 'Urgencia' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'TRAINING', label: 'Capacitación' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Baja' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

const colorOptions = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Morado' },
  { value: '#ec4899', label: 'Rosa' },
]

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  event,
}: CreateEventModalProps) {
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const isEditMode = !!event

  // Fetch inventory for equipment selection
  const { data: inventoryData } = useInventory({ status: 'AVAILABLE' })
  const inventory = inventoryData?.items || []

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    color: '#3b82f6',
    priority: 'NORMAL' as NotificationPriority,
    tags: [],
    participantIds: [],
    category: 'OTHER' as EventCategory,
    meetingEquipment: {
      keyboardId: undefined,
      mouseId: undefined,
      cameraId: undefined,
      microphoneId: undefined,
      equipmentId: undefined,
    },
  })

  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})

  // Initialize form with event data or initial date
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startTime)
      const endDate = event.endTime ? new Date(event.endTime) : null
      const metadata = event.metadata as { category?: EventCategory; meetingEquipment?: any } | null

      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: formatDateTimeLocal(startDate),
        endTime: endDate ? formatDateTimeLocal(endDate) : '',
        allDay: event.allDay,
        location: event.location || '',
        color: event.color || '#3b82f6',
        priority: event.priority,
        tags: event.tags || [],
        participantIds: event.participants.map((p) => p.userId),
        category: (metadata?.category as EventCategory) || 'OTHER',
        meetingEquipment: metadata?.meetingEquipment || {
          keyboardId: undefined,
          mouseId: undefined,
          cameraId: undefined,
          microphoneId: undefined,
          equipmentId: undefined,
        },
      })
    } else if (initialDate) {
      const date = new Date(initialDate)
      date.setHours(9, 0, 0, 0) // Default to 9 AM
      setFormData((prev) => ({
        ...prev,
        startTime: formatDateTimeLocal(date),
      }))
    }
  }, [event, initialDate])

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: string } }
  ) => {
    const { name, value } = event.target
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
      // Clear error for this field
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const validate = () => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La fecha de inicio es requerida'
    }

    if (formData.endTime && formData.startTime) {
      const start = new Date(formData.startTime)
      const end = new Date(formData.endTime)
      if (end <= start) {
        newErrors.endTime = 'La fecha de fin debe ser posterior a la de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    try {
      // Build metadata
      const metadata: Record<string, any> = {
        category: formData.category,
      }

      // Include meeting equipment if category is MEETING
      if (formData.category === 'MEETING' && formData.meetingEquipment) {
        const equipment = formData.meetingEquipment
        const hasEquipment = equipment.keyboardId || equipment.mouseId || equipment.cameraId ||
                            equipment.microphoneId || equipment.equipmentId

        if (hasEquipment) {
          metadata.meetingEquipment = equipment
        }
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        allDay: formData.allDay,
        location: formData.location.trim() || undefined,
        color: formData.color,
        priority: formData.priority,
        tags: formData.tags,
        participantIds: formData.participantIds.length > 0 ? formData.participantIds : undefined,
        metadata,
      }

      if (isEditMode && event) {
        await updateEvent.mutateAsync({ id: event.id, data: eventData })
      } else {
        await createEvent.mutateAsync(eventData)
      }

      onSuccess?.()
      handleClose()
    } catch {
      // Silent fail
    }
  }

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit()
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      allDay: false,
      location: '',
      color: '#3b82f6',
      priority: 'NORMAL' as NotificationPriority,
      tags: [],
      participantIds: [],
      category: 'OTHER' as EventCategory,
      meetingEquipment: {
        keyboardId: undefined,
        mouseId: undefined,
        cameraId: undefined,
        microphoneId: undefined,
        equipmentId: undefined,
      },
    })
    setTagInput('')
    setErrors({})
    onClose()
  }

  // Helper to get equipment options by category
  const getEquipmentOptions = (category: string) => {
    return inventory
      .filter(item => item.category === category && item.status === 'AVAILABLE')
      .map(item => ({
        value: item.id.toString(),
        label: `${item.name}${item.brand ? ` - ${item.brand}` : ''}${item.model ? ` ${item.model}` : ''}`,
      }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}
      className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end w-full gap-2 sm:gap-3">
          <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createEvent.isPending || updateEvent.isPending}
            className="w-full sm:w-auto"
          >
            {createEvent.isPending || updateEvent.isPending
              ? 'Guardando...'
              : isEditMode
              ? 'Guardar Cambios'
              : 'Crear Evento'}
          </Button>
        </div>
      }
    >
      <form onSubmit={onFormSubmit} className="space-y-2 sm:space-y-3">
        {/* Title */}
        <Input
          label="Título *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="Ej: Reunión de equipo"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-white/10 border border-white/20',
              'text-white placeholder-white/50',
              'focus:outline-none focus:ring-2 focus:ring-white/50',
              'resize-none'
            )}
            placeholder="Descripción del evento..."
          />
        </div>

        {/* Date and Time + All Day */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Fecha y hora de inicio *"
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={errors.startTime}
              required
            />
            <Input
              label="Fecha y hora de fin"
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={errors.endTime}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              name="allDay"
              checked={formData.allDay}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-2 focus:ring-white/50"
            />
            <label htmlFor="allDay" className="text-sm text-white/80">
              Evento de todo el día
            </label>
          </div>
        </div>

        {/* Location and Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            label="Ubicación"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ej: Sala de reuniones A"
          />
          <Select
            label="Categoría"
            name="category"
            value={formData.category || 'OTHER'}
            onChange={handleChange}
            options={categoryOptions}
          />
        </div>

        {/* Meeting Equipment - Only shown if category is MEETING */}
        {formData.category === 'MEETING' && (
          <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white/90 mb-2">Equipos para la Reunión</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SearchableSelect
                label="Teclado"
                options={getEquipmentOptions('KEYBOARD')}
                value={formData.meetingEquipment?.keyboardId?.toString() || ''}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingEquipment: { ...prev.meetingEquipment, keyboardId: value ? parseInt(value) : undefined },
                  }))
                }
                placeholder="Seleccionar teclado..."
              />

              <SearchableSelect
                label="Mouse"
                options={getEquipmentOptions('MOUSE')}
                value={formData.meetingEquipment?.mouseId?.toString() || ''}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingEquipment: { ...prev.meetingEquipment, mouseId: value ? parseInt(value) : undefined },
                  }))
                }
                placeholder="Seleccionar mouse..."
              />

              <SearchableSelect
                label="Cámara"
                options={getEquipmentOptions('CAMERA')}
                value={formData.meetingEquipment?.cameraId?.toString() || ''}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingEquipment: { ...prev.meetingEquipment, cameraId: value ? parseInt(value) : undefined },
                  }))
                }
                placeholder="Seleccionar cámara..."
              />

              <SearchableSelect
                label="Micrófono"
                options={getEquipmentOptions('MICROPHONE')}
                value={formData.meetingEquipment?.microphoneId?.toString() || ''}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingEquipment: { ...prev.meetingEquipment, microphoneId: value ? parseInt(value) : undefined },
                  }))
                }
                placeholder="Seleccionar micrófono..."
              />
            </div>

            <SearchableSelect
              label="Otro Equipo"
              options={getEquipmentOptions('OTHER')}
              value={formData.meetingEquipment?.equipmentId?.toString() || ''}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  meetingEquipment: { ...prev.meetingEquipment, equipmentId: value ? parseInt(value) : undefined },
                }))
              }
              placeholder="Seleccionar equipo adicional..."
            />
          </div>
        )}

        {/* Priority and Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select
            label="Prioridad"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
          />

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Color
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                  className={cn(
                    'w-9 h-9 rounded-lg transition-all',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50',
                    formData.color === color.value && 'ring-2 ring-white'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  aria-label={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Etiquetas
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTagInput(event.target.value)}
              placeholder="Agregar etiqueta..."
              onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              size="sm"
              className="flex-shrink-0"
              aria-label="Agregar etiqueta"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition-colors p-0.5 -mr-0.5"
                    aria-label={`Eliminar etiqueta ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
