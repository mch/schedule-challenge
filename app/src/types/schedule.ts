// Types derived from craft2026/schedule-schema.json

export interface Schedule {
  conference: Conference
  days: Day[]
}

export interface Conference {
  id: string
  name: string
  year: number
  date: string
  location: string
  domain?: string
}

export interface Day {
  id: number
  name: string
  date: string // ISO date, e.g. "2026-06-04"
  global_slots: GlobalSlot[]
  stages: Stage[]
}

export interface GlobalSlot {
  id: number
  type: 'text'
  title: string
  description?: string | null
  start_time: string // HH:MM
  end_time: string // HH:MM
}

export interface Stage {
  id: number
  name: string
  color: string // hex without #, e.g. "ff4d00"
  slots: Slot[]
}

export type SlotType = 'talk' | 'workshop' | 'text'

export interface Slot {
  id: number
  type: SlotType
  topic?: string | null
  start_time: string // HH:MM
  end_time: string // HH:MM
  title?: string | null // only for type=text
  description?: string | null
  talk?: Talk | null
  workshop?: Workshop | null
}

export interface Talk {
  id: number
  title: string
  slug: string
  topic?: string | null
  is_keynote: boolean
  is_online: boolean
  description?: string | null
  level?: string | null
  video_url?: string | null
  slides_url?: string | null
  tags: Tag[]
  speakers: Speaker[]
}

export interface Workshop {
  id: number
  title: string
  slug: string
  topic?: string | null
  tags: Tag[]
  speakers: Speaker[]
}

export interface Speaker {
  name: string
  slug: string
  topic?: string | null
}

export interface Tag {
  id: number
  name: string
  is_trending?: boolean
}
