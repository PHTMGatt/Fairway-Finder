import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TripList, { TripDeleteError } from './TripList';
import {
  deleteTripWithConfirmation,
  formatTripDate,
  sortTripsForDisplay,
} from './TripList.utils';

const trip = { _id: 'trip-1', name: 'Northern Michigan' };

describe('safe trip deletion', () => {
  it('cancellation performs no delete mutation', async () => {
    let calls = 0;
    const result = await deleteTripWithConfirmation(
      trip,
      async () => {
        calls += 1;
      },
      () => false
    );

    expect(calls).toBe(0);
    expect(result).toBeNull();
  });

  it('confirmation deletes only the requested trip', async () => {
    let receivedTripId = '';
    const result = await deleteTripWithConfirmation(
      trip,
      async ({ variables }) => {
        receivedTripId = variables.tripId;
      },
      () => true
    );

    expect(receivedTripId).toBe('trip-1');
    expect(result).toBeNull();
  });

  it('returns a visible message when the delete mutation fails', async () => {
    const result = await deleteTripWithConfirmation(
      trip,
      async () => {
        throw new Error('Trip could not be deleted');
      },
      () => true
    );

    expect(result).toBe('Trip could not be deleted');
  });

  it('renders delete failures as an accessible alert', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TripDeleteError, { message: 'Trip could not be deleted' })
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Trip could not be deleted');
  });

  it('does not expose a bulk Delete All Trips action', () => {
    const markup = renderToStaticMarkup(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <TripList trips={[{ ...trip, courses: [] }]} />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(markup).not.toContain('Delete All Trips');
  });
});

describe('saved trip usefulness', () => {
  it('puts upcoming trips first, undated trips next, and past trips last', () => {
    const trips = [
      { _id: 'past', name: 'Past', date: '2026-10-01' },
      { _id: 'later', name: 'Later', date: '2026-11-05' },
      { _id: 'undated', name: 'Undated' },
      { _id: 'next', name: 'Next', date: '2026-10-30' },
      { _id: 'today', name: 'Today', date: '2026-10-25' },
    ];

    expect(sortTripsForDisplay(trips, '2026-10-25').map((item) => item._id)).toEqual([
      'today',
      'next',
      'later',
      'undated',
      'past',
    ]);
  });

  it('formats ISO trip dates without timezone rollover', () => {
    expect(formatTripDate('2026-10-30')).toBe('Oct 30, 2026');
    expect(formatTripDate('')).toBe('Date not set');
  });
});
