// Calendar Event Types
export interface CalendarEvent {
  id: number
  title: string
  description?: string | null
  startTime: string
  endTime?: string | null
  allDay: boolean
  location?: string | null
  color?: string | null
  priority: NotificationPriority
  tags: string[]
  metadata: Record<string, unknown> | null
  isArchived: boolean
  createdById?: number | null
  createdAt: string
  updatedAt: string
  participants: EventParticipant[]
  reminders: EventReminder[]
  attachments: EventAttachment[]
}

export interface EventParticipant {
  id: number
  eventId: number
  userId: number
  role: ParticipantRole
  responseStatus?: ResponseStatus | null
  notifiedAt?: string | null
  createdAt: string
  user: ParticipantUser
}

export interface ParticipantUser {
  id: number
  username: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  isActive: boolean
}

export interface EventReminder {
  id: number
  scheduledAt: string
  deliveredAt?: string | null
  status: ReminderStatus
  context?: string | null
}

export interface EventAttachment {
  id: number
  eventId: number
  entityType: AttachmentType
  entityId: number
  label?: string | null
  createdAt: string
}

// Type literals (compatible with erasableSyntaxOnly)
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type ParticipantRole = 'ORGANIZER' | 'ATTENDEE'

export type ResponseStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE'

export type ReminderStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED'

export type AttachmentType = 'TICKET' | 'EQUIPMENT' | 'EMPLOYEE' | 'AREA' | 'PURCHASE' | 'OTHER'

// DTOs for API requests
export interface CreateEventDto {
  title: string
  description?: string
  startTime: string
  endTime?: string
  allDay?: boolean
  location?: string
  color?: string
  priority?: NotificationPriority
  tags?: string[]
  participantIds?: number[]
  attachments?: CreateAttachmentDto[]
  sendInitialNotification?: boolean
  metadata?: Record<string, unknown>
}

export interface UpdateEventDto {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  location?: string
  color?: string
  priority?: NotificationPriority
  tags?: string[]
  participantIds?: number[]
  attachments?: CreateAttachmentDto[]
  regenerateReminders?: boolean
  isArchived?: boolean
  metadata?: Record<string, unknown>
}

export interface CreateAttachmentDto {
  entityType: AttachmentType
  entityId: number
  label?: string
}

export interface QueryEventsParams {
  participantId?: number
  onlyUpcoming?: string
  start?: string
  end?: string
  search?: string
  limit?: number
}

export interface EventsResponse {
  success: boolean
  data: CalendarEvent[]
  meta: {
    total: number
  }
}

// UI specific types
export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

export interface CalendarWeek {
  days: CalendarDay[]
}

export interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  selectedDate?: Date
}

export type EventCategory = 'MEETING' | 'URGENT' | 'MAINTENANCE' | 'TRAINING' | 'OTHER'

// Daily Backup Event Metadata
export interface DailyBackupMetadata {
  type: 'daily-backup'
  backupId: number
  diskId: number
  diskName?: string
  diskSequence?: number
  completed: boolean
  readonly: boolean
  isPast: boolean
  isToday: boolean
  totalFiles: number
  completedFiles: number
  files?: Array<{
    fileTypeId: number
    fileTypeName?: string
    fileTypeCode?: string
    statusId: number
    statusCode?: string
    statusLabel?: string
    isFinal?: boolean
  }>
  statuses?: {
    backupZip?: string
    backupAdjuntosZip?: string
    calipsoBak?: string
    presupuestacionBak?: string
  }
  completedBy?: string
  completedAt?: string
  isPending?: boolean
}

export interface MeetingEquipment {
  keyboardId?: number
  mouseId?: number
  cameraId?: number
  microphoneId?: number
  equipmentId?: number
}

export interface EventFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  allDay: boolean
  location: string
  color: string
  priority: NotificationPriority
  tags: string[]
  participantIds: number[]
  category?: EventCategory
  meetingEquipment?: MeetingEquipment
}
