import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarLink } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/data.js')
import { loadCalendarLinks, saveCalendarLinks } from '../../src/infrastructure/data.js'

import {
  deleteCalendarLink,
  listCalendarLinks,
  upsertCalendarLink,
} from '../../src/application/calendarLinkService.js'

const existing: CalendarLink = {
  id: 'cl1',
  channelId: 'ch1',
  apartmentId: 'apt1',
  url: 'https://example.com/old.ics',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadCalendarLinks).mockReturnValue([existing])
  vi.mocked(saveCalendarLinks).mockImplementation(() => undefined)
})

describe('listCalendarLinks', () => {
  it('delegates to loadCalendarLinks', () => {
    expect(listCalendarLinks()).toEqual([existing])
  })
})

describe('upsertCalendarLink', () => {
  it('updates url when a link with same channel + apartment already exists', () => {
    const result = upsertCalendarLink({
      channelId: 'ch1',
      apartmentId: 'apt1',
      url: 'https://example.com/new.ics',
    })
    expect(result.id).toBe('cl1')
    expect(result.url).toBe('https://example.com/new.ics')
    expect(saveCalendarLinks).toHaveBeenCalledOnce()
  })

  it('creates a new link with generated id when no match exists', () => {
    vi.mocked(loadCalendarLinks).mockReturnValue([])
    const result = upsertCalendarLink({
      channelId: 'ch2',
      apartmentId: 'apt2',
      url: 'https://example.com/fresh.ics',
    })
    expect(result.id).toBeDefined()
    expect(result.id).not.toBe('')
    expect(result.channelId).toBe('ch2')
    expect(result.apartmentId).toBe('apt2')
    expect(saveCalendarLinks).toHaveBeenCalledOnce()
  })

  it('creates a new link when only one of channel/apartment matches', () => {
    const result = upsertCalendarLink({
      channelId: 'ch1',
      apartmentId: 'apt-other',
      url: 'https://example.com/other.ics',
    })
    expect(result.id).not.toBe('cl1')
    expect(saveCalendarLinks).toHaveBeenCalledOnce()
  })
})

describe('deleteCalendarLink', () => {
  it('removes the link with the given id', () => {
    deleteCalendarLink('cl1')
    expect(saveCalendarLinks).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => deleteCalendarLink('ghost')).toThrow('not found')
  })
})
