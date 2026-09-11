import type { Field } from 'payload'

/** An append-only event log shown on orders and service requests. */
export const timelineField: Field = {
  name: 'timeline',
  type: 'array',
  admin: {
    description: 'Automatic history of status changes and notes.',
    initCollapsed: true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'at', type: 'date', required: true, admin: { width: '35%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'event', type: 'text', required: true, admin: { width: '65%' } },
      ],
    },
    { name: 'note', type: 'text' },
    { name: 'by', type: 'text', admin: { description: 'Staff member or "system".' } },
  ],
}

export type TimelineEntry = {
  at: string
  event: string
  note?: string | null
  by?: string | null
  id?: string | null
}

export const appendTimeline = (
  existing: readonly TimelineEntry[] | null | undefined,
  entry: { event: string; note?: string | null; by?: string | null; at?: string },
): TimelineEntry[] => [
  ...(existing ?? []),
  {
    at: entry.at ?? new Date().toISOString(),
    event: entry.event,
    note: entry.note ?? undefined,
    by: entry.by ?? 'system',
  },
]
