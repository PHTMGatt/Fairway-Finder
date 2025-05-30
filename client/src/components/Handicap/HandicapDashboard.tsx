import { useEffect, useState } from 'react';
import { getRounds, Round, clearRounds } from '../../utils/roundStorage';
import { calculateHandicapIndex } from '../../utils/handicap';

export default function HandicapDashboard() {
  const [rounds, setRounds] = useState<Round[]>([]);

  const refreshRounds = () => {
    setRounds(getRounds());
  };

  useEffect(() => {
    refreshRounds();
  }, []);

  const handicap = calculateHandicapIndex(rounds);

  return (
    <div>
      <h2>Your Handicap: {handicap !== null ? handicap : 'N/A'}</h2>
      <button onClick={() => { clearRounds(); refreshRounds(); }}>Clear All Rounds</button>
      <ul>
        {rounds.map((r, idx) => (
          <li key={idx}>
            {r.date}: Score {r.adjustedGrossScore}, Rating {r.courseRating}, Slope {r.slopeRating}
          </li>
        ))}
      </ul>
    </div>
  );
}