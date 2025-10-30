import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generatePDFReport } from '../utils/pdfGenerator';
import { AnimatedStats } from './AnimatedStats';
import { getDomainConfig } from '../utils/domainConfig';
import { captureQuizResults } from '../utils/leadCapture';

export function ResultsDashboard({ history, finalScore, user, onReset, onViewHistory, questionTimes = [], streak = 0, selectedMode, selectedDomain = null }) {
  const [percentile, setPercentile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    generateRecommendations();

    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    if (user && !user.isGuest && user.email && user.name) {
      const totalQuestions = history.length;
      const correctAnswers = history.filter(h => h.answerClass === 'mastery').length;
      const avgTime = questionTimes.length > 0
        ? questionTimes.reduce((sum, time) => sum + time, 0) / questionTimes.length
        : 0;

      captureQuizResults(user.name, user.email, {
        totalScore: finalScore,
        percentage: overallAccuracy,
        domainScores: getDomainBreakdown(),
        difficulty: 'mixed',
        mode: selectedMode || 'practice',
        totalQuestions,
        correctAnswers,
        duration: Math.round(avgTime * totalQuestions),
        streak
      }).catch(err => {
        console.error('Failed to capture quiz results:', err);
      });
    }

    return () => clearTimeout(timer);
  }, [history, finalScore, user]);

  const getRecommendedClass = () => {
    const questionsAnswered = history.length;
    const lowThreshold = questionsAnswered * 1;
    const midThreshold = questionsAnswered * 2;

    if (finalScore >= lowThreshold - 5 && finalScore <= lowThreshold + 5) {
      return {
        name: 'First Steps',
        logo: '/First Steps Logo.png',
        color: '#F72585'
      };
    } else if (finalScore >= midThreshold - 5 && finalScore <= midThreshold + 5) {
      return {
        name: 'New Pathways',
        logo: '/New Pathways Logo.png',
        color: '#009DDC'
      };
    } else {
      return {
        name: 'Blueprint',
        logo: '/Blueprint Logo.png',
        color: '#F72585'
      };
    }
  };

  const generateRecommendations = () => {
    const domainStats = {};
    history.forEach(item => {
      if (!domainStats[item.domain]) {
        domainStats[item.domain] = { correct: 0, total: 0 };
      }
      domainStats[item.domain].total++;
      if (item.answerClass === 'mastery') {
        domainStats[item.domain].correct++;
      }
    });

    const recs = [];

    Object.entries(domainStats).forEach(([domain, stats]) => {
      const accuracy = stats.correct / stats.total;
      if (accuracy < 0.5) {
        recs.push({
          type: 'improve',
          domain: domain,
          message: `Focus on ${domain} - You achieved mastery on ${stats.correct} out of ${stats.total} questions (${Math.round(accuracy * 100)}%).`
        });
      } else if (accuracy >= 0.8) {
        recs.push({
          type: 'strength',
          domain: domain,
          message: `${domain.charAt(0).toUpperCase() + domain.slice(1)} is a strength! You're achieving mastery ${Math.round(accuracy * 100)}% of the time.`
        });
      }
    });

    const masteryAnswers = history.filter(h => h.answerClass === 'mastery').length;
    const accuracy = masteryAnswers / history.length;

    if (accuracy < 0.4) {
      recs.push({
        type: 'practice',
        message: 'Take your time on each question and think through the consequences of each choice.'
      });
    } else if (accuracy >= 0.7) {
      recs.push({
        type: 'advance',
        message: 'Great performance! Try a harder difficulty mode or untimed mode to challenge yourself further.'
      });
    }

    setRecommendations(recs);
  };

  const getDomainBreakdown = () => {
    const domainStats = {};
    history.forEach(item => {
      if (!domainStats[item.domain]) {
        domainStats[item.domain] = {
          mastery: 0,
          proficient: 0,
          developing: 0,
          total: 0,
          scoreDelta: 0
        };
      }
      domainStats[item.domain].total++;
      domainStats[item.domain][item.answerClass]++;
      domainStats[item.domain].scoreDelta += item.scoreDelta;
    });

    return Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      ...stats,
      accuracy: Math.round((stats.mastery / stats.total) * 100)
    }));
  };

  const masteryAnswers = history.filter(h => h.answerClass === 'mastery').length;
  const proficientAnswers = history.filter(h => h.answerClass === 'proficient').length;
  const developingAnswers = history.filter(h => h.answerClass === 'developing').length;
  const overallAccuracy = history.length > 0 ? Math.round((masteryAnswers / history.length) * 100) : 0;
  const domainBreakdown = getDomainBreakdown();
  const hasData = history.length > 0 && domainBreakdown.length > 0;

  const handleEmailResults = async () => {
    if (!user || user.isGuest || !user.email) {
      alert('Email results are only available for registered users.');
      return;
    }

    setEmailSending(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quiz-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          userName: user.email.split('@')[0],
          finalScore,
          questionsAnswered: history.length,
          masteryAnswers,
          mastery: overallAccuracy,
          reportUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        alert(`Results sent to ${user.email}!`);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="results-dashboard">
      {showCelebration && (
        <div className="celebration-overlay" onClick={() => setShowCelebration(false)}>
          <div className="celebration-content">
            <div className="trophy-icon">🏆</div>
            <h2>Congratulations!</h2>
            <p>You've completed the quiz!</p>
          </div>
        </div>
      )}

      <h1>{selectedMode === 'domain' && selectedDomain ?
        `${getDomainConfig(selectedDomain).name} Assessment Complete!` :
        'Quiz Complete!'}</h1>

      <div className="results-summary">
        <AnimatedStats label="Questions" value={history.length} delay={0} />
        <AnimatedStats label="Score" value={finalScore} delay={200} />
        <AnimatedStats label="Mastery" value={overallAccuracy} delay={400} suffix="%" />
        {hasData && (
          <div className="result-stat" style={{ animationDelay: '0.6s' }}>
            <div className="stat-label">High Score Domain</div>
            <div className="stat-value" style={{ fontSize: '18px' }}>
              {domainBreakdown.reduce((max, domain) =>
                domain.scoreDelta > max.scoreDelta ? domain : max
              , domainBreakdown[0]).domain.charAt(0).toUpperCase() +
              domainBreakdown.reduce((max, domain) =>
                domain.scoreDelta > max.scoreDelta ? domain : max
              , domainBreakdown[0]).domain.slice(1)}
            </div>
            <div style={{ fontSize: '32px', marginTop: '8px' }}>
              {domainBreakdown.reduce((max, domain) =>
                domain.scoreDelta > max.scoreDelta ? domain : max
              , domainBreakdown[0]).scoreDelta > 0 ? '🏆' : '🎯'}
            </div>
          </div>
        )}
      </div>

      <div className="class-recommendation">
        <h2>Recommended Class</h2>
        <div className="recommendation-card" style={{ borderColor: getRecommendedClass().color }}>
          <div className="recommendation-content">
            <img
              src={getRecommendedClass().logo}
              alt={getRecommendedClass().name}
              className="class-logo"
            />
            <div className="recommendation-text">
              <h3>We Recommend</h3>
              <p className="class-name">{getRecommendedClass().name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="answer-breakdown">
        <h2>Answer Breakdown</h2>
        <div className="breakdown-bars">
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span className="breakdown-color mastery"></span>
              <span>Mastery ({masteryAnswers})</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill mastery"
                style={{ width: `${(masteryAnswers / history.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span className="breakdown-color proficient"></span>
              <span>Proficient ({proficientAnswers})</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill proficient"
                style={{ width: `${(proficientAnswers / history.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span className="breakdown-color developing"></span>
              <span>Developing ({developingAnswers})</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill developing"
                style={{ width: `${(developingAnswers / history.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="domain-breakdown">
        <h2>{selectedMode === 'domain' && selectedDomain ?
          `${getDomainConfig(selectedDomain).name} Performance` :
          'Performance by Domain'}</h2>
        <div className="domain-grid">
          {domainBreakdown.map(({ domain, total, accuracy, scoreDelta }) => {
            const config = getDomainConfig(domain);
            return (
              <div key={domain} className="domain-card" style={{
                borderColor: config.borderColor,
                backgroundColor: config.bgColor
              }}>
                <h3 style={{ color: config.color }}>
                  <span style={{ marginRight: '8px' }}>{config.icon}</span>
                  {config.name}
                </h3>
                <div className="domain-stats">
                  <div className="domain-stat">
                    <span className="domain-stat-label">Questions</span>
                    <span className="domain-stat-value">{total}</span>
                  </div>
                  <div className="domain-stat">
                    <span className="domain-stat-label">Mastery</span>
                    <span className="domain-stat-value" style={{
                      color: accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444'
                    }}>
                      {accuracy}%
                    </span>
                  </div>
                  <div className="domain-stat">
                    <span className="domain-stat-label">Score</span>
                    <span className="domain-stat-value">{scoreDelta > 0 ? '+' : ''}{scoreDelta}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="achievement-badges">
        <h3 className="badges-title">Achievements Earned</h3>
        <div className="badges-container">
          {(() => {
            const earnedBadges = [];
            const avgTime = questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length : 0;
            const expectedTime = selectedMode === 'challenge' ? 15 : selectedMode === 'timed' ? 30 : 45;
            const developingCount = history.filter(h => h.answerClass === 'developing').length;

            if (avgTime > 0 && avgTime < expectedTime) {
              earnedBadges.push({ icon: '⚡', name: 'Speed Demon', description: 'Finished under expected time!', color: '#F72585' });
            }

            if (streak >= 5) {
              earnedBadges.push({ icon: '🧠', name: 'Logic Master', description: 'Achieved a streak of 5 or more!', color: '#009DDC' });
            }

            if (selectedMode === 'comprehensive') {
              earnedBadges.push({ icon: '🤔', name: 'Deep Thinker', description: 'Completed the Comprehensive test!', color: '#7209B7' });
            }

            if (developingCount === 0 && history.length > 0) {
              earnedBadges.push({ icon: '🧭', name: 'Compass', description: 'No regressive answers!', color: '#48bb78' });
            }

            const advancedQuestionsMastery = history.filter(h => h.difficulty === 3 && h.answerClass === 'mastery').length;
            if (advancedQuestionsMastery > 0) {
              earnedBadges.push({ icon: '🗺️', name: 'Explorer', description: `Mastered ${advancedQuestionsMastery} advanced question${advancedQuestionsMastery > 1 ? 's' : ''}!`, color: '#8B5CF6' });
            }

            return earnedBadges.length > 0 ? earnedBadges.map((badge, index) => (
              <div
                key={index}
                className="badge-item"
                style={{
                  animationDelay: `${index * 0.15}s`,
                  '--badge-color': badge.color
                }}
              >
                <div className="badge-icon">{badge.icon}</div>
                <span className="badge-name">{badge.name}</span>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px', textAlign: 'center' }}>{badge.description}</p>
              </div>
            )) : <p style={{ textAlign: 'center', color: '#718096' }}>Complete challenges to earn badges!</p>;
          })()}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>Personalized Recommendations</h2>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${rec.type}`}>
                <span className="recommendation-icon">
                  {rec.type === 'strength' ? '⭐' : rec.type === 'improve' ? '📈' : rec.type === 'advance' ? '🚀' : '💡'}
                </span>
                <p>{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-actions">
        <button className="btn btn-primary btn-large" onClick={onReset}>
          Take Another Quiz
        </button>
        <button className="btn btn-secondary" onClick={() => generatePDFReport(history, finalScore, user)}>
          Download Report
        </button>
        {!user?.isGuest && (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleEmailResults}
              disabled={emailSending || emailSent}
            >
              {emailSending ? 'Sending...' : emailSent ? 'Email Sent!' : 'Email Results'}
            </button>
            <button className="btn btn-secondary" onClick={onViewHistory}>
              View History
            </button>
          </>
        )}
      </div>
    </div>
  );
}
