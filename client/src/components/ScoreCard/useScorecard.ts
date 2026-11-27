// client/src/components/ScoreCard/useScorecard.ts
// Scorecard data + saves: players, optimistic score updates and the automatic handicap.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_TRIP } from '../../utils/queries';
import { ADD_PLAYER, REMOVE_PLAYER, UPDATE_PLAYER_HANDICAP, UPDATE_SCORE } from '../../utils/mutations';
import { HOLES, roundDifferential, scorecardErrorMessage } from './scorecardUtils';

export interface PlayerSubdoc {
  name: string;
  score: Record<string, number> | null;
  total: number;
  handicap?: number | null;
}

interface TripData {
  trip: {
    _id: string;
    players: PlayerSubdoc[];
  };
}

export const useScorecard = (tripId: string, courseRating?: number | null, slope?: number | null) => {
  const { loading, error, data } = useQuery<TripData>(QUERY_TRIP, {
    variables: { id: tripId },
    fetchPolicy: 'cache-and-network',
  });

  const [addPlayer, { loading: addingPlayer }] = useMutation(ADD_PLAYER);
  const [removePlayer] = useMutation(REMOVE_PLAYER);
  const [updateScore] = useMutation(UPDATE_SCORE);
  const [updatePlayerHandicap] = useMutation(UPDATE_PLAYER_HANDICAP);

  const [saveError, setSaveError] = useState<string | null>(null);
  const savedHandicaps = useRef(new Map<string, number>());

  const players = useMemo(() => data?.trip?.players ?? [], [data?.trip?.players]);

  // Automatic handicap: once a player has all 18 holes and rating/slope are known,
  // store the score differential as their handicap index (once per value).
  useEffect(() => {
    for (const player of players) {
      const diff = roundDifferential(player.score, courseRating, slope);
      if (diff === null || player.handicap === diff || savedHandicaps.current.get(player.name) === diff) continue;
      savedHandicaps.current.set(player.name, diff);
      void updatePlayerHandicap({ variables: { tripId, name: player.name, handicap: diff } }).catch(() => {
        savedHandicaps.current.delete(player.name);
      });
    }
  }, [players, courseRating, slope, tripId, updatePlayerHandicap]);

  /** Runs a save, surfacing any failure inline. Resolves true when it worked. */
  const save = async (action: () => Promise<unknown>): Promise<boolean> => {
    setSaveError(null);
    try {
      await action();
      return true;
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
      return false;
    }
  };

  const add = (name: string) => save(() => addPlayer({ variables: { tripId, name } }));

  const remove = async (name: string) => {
    if (!window.confirm(`Remove ${name}? Their scores on this trip will be deleted too.`)) return;
    await save(() => removePlayer({ variables: { tripId, name } }));
  };

  const setScore = (playerName: string, holeNum: number, newScore: number): Promise<boolean> => {
    const player = players.find((p) => p.name === playerName);
    const nextScore = { ...(player?.score ?? {}), [`H${holeNum}`]: newScore };
    const nextTotal = HOLES.reduce((sum, h) => sum + (nextScore[`H${h}`] ?? 0), 0);
    return save(() =>
      updateScore({
        variables: { tripId, player: playerName, hole: holeNum, score: newScore },
        // Instant feedback on the course: the number changes on tap, the server confirms after.
        optimisticResponse: {
          updateScore: {
            __typename: 'Trip',
            _id: tripId,
            players: players.map((p) => ({
              __typename: 'Player',
              name: p.name,
              handicap: p.handicap ?? null,
              score: p.name === playerName ? nextScore : p.score,
              total: p.name === playerName ? nextTotal : p.total,
            })),
          },
        },
      })
    );
  };

  return {
    trip: data?.trip,
    loading,
    error,
    players,
    addingPlayer,
    saveError,
    add,
    remove,
    setScore,
  };
};
