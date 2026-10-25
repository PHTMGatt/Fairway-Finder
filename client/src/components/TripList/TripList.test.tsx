import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TripList, * as TripListModule from './TripList';

type TripSummary = { _id: string; name: string };
type DeleteMutation = (options: { variables: { tripId: string } }) => Promise<unknown>;
type DeleteWithConfirmation = (
  trip: TripSummary,
  deleteTrip: DeleteMutation,
  confirmDelete: (message: string) => boolean
) => Promise<string | null>;
type ErrorComponent = React.ComponentType<{ message: string | null }>;

const deleteTripWithConfirmation = (TripListModule as unknown as {
  deleteTripWithConfirmation?: DeleteWithConfirmation;
}).deleteTripWithConfirmation;

const TripDeleteError = (TripListModule as unknown as {
  TripDeleteError?: ErrorComponent;
}).TripDeleteError;

const trip = { _id: 'trip-1', name: 'Northern Michigan' };

describe('safe trip deletion', () => {
  it('cancellation performs no delete mutation', async () => {
    expect(deleteTripWithConfirmation).toBeTypeOf('function');
    if (!deleteTripWithConfirmation) return;

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
    expect(deleteTripWithConfirmation).toBeTypeOf('function');
    if (!deleteTripWithConfirmation) return;

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
    expect(deleteTripWithConfirmation).toBeTypeOf('function');
    if (!deleteTripWithConfirmation) return;

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
    expect(TripDeleteError).toBeTypeOf('function');
    if (!TripDeleteError) return;

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
