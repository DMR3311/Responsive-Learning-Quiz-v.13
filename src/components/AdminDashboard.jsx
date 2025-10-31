import { useState, useEffect } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';

export default function AdminDashboard({ onLogout, adminPassword }) {
  const [sessions, setSessions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [domainStats, setDomainStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-data`, {
        headers: {
          'Authorization': `Bearer ${adminPassword}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setAnswers(data.answers || []);
      setDomainStats(data.domainStats || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      let csv = 'Session ID,Email,Mode,Final Score,Questions Answered,Optimal Answers,Started At,Completed At,Duration (min),Question ID,Domain,Selected Option,Answer Class,Score Delta,Time Taken (s)\n';

      sessions.forEach(session => {
        const duration = session.completed_at && session.started_at
          ? ((new Date(session.completed_at) - new Date(session.started_at)) / 60000).toFixed(2)
          : 'N/A';

        const sessionAnswers = answers.filter(a => a.session_id === session.id);

        if (sessionAnswers.length > 0) {
          sessionAnswers.forEach(answer => {
            csv += `"${session.id}","${session.email || 'N/A'}","${session.mode}",${session.final_score},${session.questions_answered},${session.optimal_answers},"${session.started_at}","${session.completed_at || 'N/A'}",${duration},"${answer.question_id}","${answer.domain}","${answer.selected_option}","${answer.answer_class}",${answer.score_delta},${answer.time_taken_seconds || 'N/A'}\n`;
          });
        } else {
          csv += `"${session.id}","${session.email || 'N/A'}","${session.mode}",${session.final_score},${session.questions_answered},${session.optimal_answers},"${session.started_at}","${session.completed_at || 'N/A'}",${duration},"N/A","N/A","N/A","N/A","N/A","N/A"\n`;
        }
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data');
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'completed') return session.completed_at !== null;
    if (filter === 'incomplete') return session.completed_at === null;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading quiz history...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '20px', padding: '15px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="admin-controls">
        <div className="filter-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Sessions ({sessions.length})</option>
            <option value="completed">Completed ({sessions.filter(s => s.completed_at).length})</option>
            <option value="incomplete">Incomplete ({sessions.filter(s => !s.completed_at).length})</option>
          </select>
        </div>
        <button onClick={exportToCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Mode</th>
              <th>Score</th>
              <th>Questions</th>
              <th>Optimal</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(session => (
              <tr key={session.id} className={!session.completed_at ? 'incomplete' : ''}>
                <td>{session.email || 'N/A'}</td>
                <td><span className="mode-badge">{session.mode}</span></td>
                <td>{session.final_score}</td>
                <td>{session.questions_answered}</td>
                <td>{session.optimal_answers}</td>
                <td>{formatDate(session.started_at)}</td>
                <td>{formatDate(session.completed_at)}</td>
                <td>{calculateDuration(session.started_at, session.completed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSessions.length === 0 && (
        <div className="no-data">No sessions found</div>
      )}
    </div>
  );
}
