import { useState } from 'react';
import { saveRound } from '../../utils/roundStorage';

export default function RoundForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    adjustedGrossScore: '',
    courseRating: '',
    slopeRating: '',
    date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRound({
      adjustedGrossScore: parseFloat(form.adjustedGrossScore),
      courseRating: parseFloat(form.courseRating),
      slopeRating: parseInt(form.slopeRating),
      date: form.date,
    });
    setForm({ adjustedGrossScore: '', courseRating: '', slopeRating: '', date: '' });
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="round-form">
      <input name="adjustedGrossScore" placeholder="Score" value={form.adjustedGrossScore} onChange={handleChange} required />
      <input name="courseRating" placeholder="Course Rating" value={form.courseRating} onChange={handleChange} required />
      <input name="slopeRating" placeholder="Slope Rating" value={form.slopeRating} onChange={handleChange} required />
      <input name="date" type="date" value={form.date} onChange={handleChange} required />
      <button type="submit">Save Round</button>
    </form>
  );
}