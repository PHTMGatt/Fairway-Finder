import { useState, useEffect } from 'react';
import { Round, getRounds, saveRound, clearRounds } from '../../utils/roundStorage';
import { calculateHandicapIndex } from '../../utils/handicap';
import './HandicapTracker.css';

export default function HandicapTracker() {
  const [form, setForm] = useState({
    adjustedGrossScore: '',
    courseRating: '',
    slopeRating: '',
    date: '',
  });

  const [rounds, setRounds] = useState<Round[]>([]);
  const [handicap, setHandicap] = useState<number | null>(null);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = () => {
    const savedRounds = getRounds();
    setRounds(savedRounds);
    setHandicap(calculateHandicapIndex(savedRounds));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRound: Round = {
      adjustedGrossScore: parseFloat(form.adjustedGrossScore),
      courseRating: parseFloat(form.courseRating),
      slopeRating: parseInt(form.slopeRating),
      date: form.date,
    };
    saveRound(newRound);
    setForm({ adjustedGrossScore: '', courseRating: '', slopeRating: '', date: '' });
    loadRounds();
  };

  const handleClear = () => {
    clearRounds();
    setRounds([]);
    setHandicap(null);
  };

  return (
    <div className="handicap-container">
      <h1 className="title">Handicap Tracker</h1>

      <form className="round-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Adjusted Gross Score</label>
          <input name="adjustedGrossScore" value={form.adjustedGrossScore} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Course Rating</label>
          <input name="courseRating" value={form.courseRating} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Slope Rating</label>
          <input name="slopeRating" value={form.slopeRating} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </div>

        <div className="button-wrapper">
          <button type="submit" className="submit-btn">
            Save Round
          </button>
        </div>
      </form>

      <div className="handicap-info">
        <h2>Your Handicap Index</h2>
        <p className="handicap-value">{handicap !== null ? handicap : 'N/A'}</p>
        <button className="clear-btn" onClick={handleClear}>Clear All Rounds</button>
      </div>

      <div className="rounds-list">
        <h3>Previous Rounds</h3>
        {rounds.map((round, i) => (
          <div className="round-card" key={i}>
            <p><strong>Date:</strong> {round.date}</p>
            <p><strong>Score:</strong> {round.adjustedGrossScore}</p>
            <p><strong>Rating:</strong> {round.courseRating}</p>
            <p><strong>Slope:</strong> {round.slopeRating}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
