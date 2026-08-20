import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteCalendarLink,
  listCalendarLinks,
  upsertCalendarLink,
} from '../../src/application/calendarLinkService.js'
import * as apartments from '../../src/infrastructure/repositories/apartments.js'
import * as calendarLinks from '../../src/infrastructure/repositories/calendarLinks.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import { APARTMENT, CHANNEL, seedBase, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
  apartments.insert({ ...APARTMENT, id: 'apt2', name: 'Villa' })
  channels.insert({ ...CHANNEL, id: 'ch2', name: 'Airbnb' })
  calendarLinks.insert({
    id: 'cl1',
    channelId: 'ch1',
    apartmentId: 'apt1',
    url: 'https://example.com/old.ics',
  })
})

describe('listCalendarLinks', () => {
  it('returns the stored links', () => {
    expect(listCalendarLinks()).toEqual([
      { id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://example.com/old.ics' },
    ])
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
    expect(listCalendarLinks()).toHaveLength(1)
  })

  it('creates a new link with generated id when no match exists', () => {
    const result = upsertCalendarLink({
      channelId: 'ch2',
      apartmentId: 'apt2',
      url: 'https://example.com/fresh.ics',
    })

    expect(result.id).not.toBe('cl1')
    expect(calendarLinks.findById(result.id)).toEqual(result)
  })

  it('creates a new link when only one of channel/apartment matches', () => {
    const result = upsertCalendarLink({
      channelId: 'ch1',
      apartmentId: 'apt2',
      url: 'https://example.com/other.ics',
    })

    expect(result.id).not.toBe('cl1')
    expect(listCalendarLinks()).toHaveLength(2)
  })

  it('accepts webcal urls', () => {
    const result = upsertCalendarLink({
      channelId: 'ch2',
      apartmentId: 'apt1',
      url: 'webcal://example.com/f.ics',
    })

    expect(result.url).toBe('webcal://example.com/f.ics')
  })

  it('rejects a malformed url', () => {
    expect(() =>
      upsertCalendarLink({ channelId: 'ch1', apartmentId: 'apt1', url: 'not-a-url' }),
    ).toThrow('Invalid URL format')
  })

  it('rejects a disallowed protocol', () => {
    expect(() =>
      upsertCalendarLink({ channelId: 'ch1', apartmentId: 'apt1', url: 'ftp://example.com/f.ics' }),
    ).toThrow('protocol')
  })
})

describe('deleteCalendarLink', () => {
  it('removes the link with the given id', () => {
    deleteCalendarLink('cl1')

    expect(listCalendarLinks()).toEqual([])
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => deleteCalendarLink('ghost')).toThrow('not found')
  })

  it('cascades when the referenced apartment is deleted', () => {
    apartments.deleteById('apt1')

    expect(listCalendarLinks()).toEqual([])
  })
})
