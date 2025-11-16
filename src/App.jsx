import { useState, useEffect } from 'react';
import { QuizEngine } from './quizEngine';
import { AuthForm } from './components/AuthForm';
import { Profile } from './components/Profile';
import { ModeSelector } from './components/ModeSelector';
import { DomainSelector } from './components/DomainSelector';
import { ProgressBar } from './components/ProgressBar';
import { ResultsDashboard } from './components/ResultsDashboard';
import { WelcomeIntro } from './components/WelcomeIntro';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { getFeedbackMessage, getEncouragementMessage } from './utils/feedbackMessages';
import { getDomainConfig } from './utils/domainConfig';
import { reportQuizResults } from './utils/reportResults';
import quizData from '../data/items.json';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [gameState, setGameState] = useState('mode-select');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [engine, setEngine] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [streak, setStreak] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('blueprint_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const pendingRaw = localStorage.getItem('pendingReports');
    if (!pendingRaw) return;

    let pending;
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      console.error('Failed to parse pendingReports from localStorage');
      return;
    }
    if (!Array.isArray(pending) || pending.length === 0) return;

    (async () => {
      const stillPending = [];
      for (const item of pending) {
        try {
          const res = await reportQuizResults(item.summary);
          if (!res || !res.success) {
            stillPending.push(item);
          }
        } catch (err) {
          console.error('Failed to resend pending report', err);
          stillPending.push(item);
        }
      }
      localStorage.setItem('pendingReports', JSON.stringify(stillPending));
    })();
  }, []);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameState]);
  useEffect(() => {
    const sendHeight = () => {
      try {
        const rootEl = document.getElementById('root');
        const body = document.body;
        const doc = document.documentElement;
        const height = Math.max(
          rootEl ? rootEl.scrollHeight : 0,
          body ? body.scrollHeight : 0,
          doc ? doc.scrollHeight : 0
        );
        window.parent.postMessage({ quizHeight: height }, '*');
      } catch (e) {
        console.error('Failed to postMessage quiz height', e);
      }
    };

    sendHeight();

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    window.addEventListener('resize', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, []);


  useEffect(() => {
    if (gameState !== 'quiz' || showFeedback || !engine) return;

    const inactivityTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity >= 60000) {
        completeQuiz(engine);
      }
    }, 1000);

    return () => clearInterval(inactivityTimer);
  }, [gameState, showFeedback, lastActivityTime, engine]);


  const handleAuthSuccess = (isGuest = false, isNewUser = true) => {
    if (isGuest) {
      setUser({ isGuest: true });
      setGameState('mode-select');
    } else {
      const savedUser = localStorage.getItem('blueprint_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setGameState(isNewUser ? 'welcome' : 'mode-select');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('blueprint_user');
    setUser(null);
    resetQuiz();
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode === 'domain') {
      setGameState('domain-select');
    }
  };

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain);
  };

  const handleStartQuiz = async () => {
    const newEngine = new QuizEngine(quizData, selectedMode, selectedDomain);
    setEngine(newEngine);
    setGameState('quiz');
    setSessionId(Date.now().toString());

    loadNextQuestion(newEngine);
  };

  const loadNextQuestion = (engineInstance) => {
    if (engineInstance.isQuizComplete()) {
      completeQuiz(engineInstance);
      return;
    }

    const nextQuestion = engineInstance.getNextQuestion();
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setSelectedOption(null);
      setShowFeedback(false);
      setFeedback(null);
      setQuestionNumber(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setLastActivityTime(Date.now());
      window.scrollTo(0, 0);
    } else {
      completeQuiz(engineInstance);
    }
  };

  const handleOptionSelect = (optionId) => {
    if (!showFeedback) {
      setSelectedOption(optionId);
      setLastActivityTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const result = engine.submitAnswer(currentQuestion, selectedOption);

    const isCorrect = result.answerClass === currentQuestion.key.optimal_class;
    const feedbackMsg = getFeedbackMessage(result.answerClass, currentQuestion.domain, isCorrect);
    const encouragement = getEncouragementMessage(streak, engine.getScore(), questionNumber);

    setFeedback({ ...result, ...feedbackMsg, encouragement, correctOption: currentQuestion.options.find(opt => opt.class === currentQuestion.key.optimal_class) });
    setShowFeedback(true);
    setLastActivityTime(Date.now());
    setQuestionTimes(prev => [...prev, timeTaken]);



    let newStreak = streak;
    if (result.answerClass === 'mastery') {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 10) {
        setTimeout(() => completeQuiz(engine), 1500);
        return;
      }
    } else {
      setStreak(0);
    }

  };

  const handleEndQuiz = async () => {
    await completeQuiz(engine);
  };

  const handleNext = () => {
    loadNextQuestion(engine);
  };


  const completeQuiz = async (engineInstance) => {
    const history = engineInstance.getHistory();
    const finalScore = engineInstance.getScore();
    const optimalAnswers = history.filter(h => h.answerClass === 'mastery').length;

    try {
      await reportQuizResults({
        user,
        selectedMode,
        selectedDomain,
        history,
        finalScore,
        optimalAnswers,
        questionTimes,
      });
    } catch (error) {
      console.error('Failed to report quiz results:', error);
    }

    setGameState('results');
  };


  const resetQuiz = () => {
    setEngine(null);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setShowFeedback(false);
    setFeedback(null);
    setQuestionNumber(0);
    setSessionId(null);
    setSelectedMode(null);
    setSelectedDomain(null);
    setStreak(0);
    setQuestionTimes([]);
    setGameState('mode-select');
  };


  if (!authChecked) {
    return (
      <div className="quiz-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (showAdmin) {
    if (!isAdmin) {
      return <AdminLogin onLogin={(password) => { setIsAdmin(true); setAdminPassword(password); }} />;
    }
    return <AdminDashboard adminPassword={adminPassword} onLogout={() => { setIsAdmin(false); setShowAdmin(false); setAdminPassword(null); }} />;
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (gameState === 'welcome') {
    return (
      <div className="quiz-container">
        <WelcomeIntro
          onStart={(difficulty) => {
            setSelectedMode(difficulty);
            setGameState('mode-select');
          }}
          userName={user?.user_metadata?.name || user?.email?.split('@')[0] || user?.name || 'there'}
        />
      </div>
    );
  }

  if (gameState === 'mode-select') {
    return (
      <div className="quiz-container">
        <Profile user={user} onSignOut={handleSignOut} />
        <button
          onClick={() => setShowAdmin(true)}
          className="admin-access-btn"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: 0.5
          }}
        >
          Admin
        </button>
        <ModeSelector
          selectedMode={selectedMode}
          onSelectMode={handleModeSelect}
          onStart={handleStartQuiz}
        />
      </div>
    );
  }

  if (gameState === 'domain-select') {
    return (
      <div className="quiz-container">
        <Profile user={user} onSignOut={handleSignOut} />
        <DomainSelector
          selectedDomain={selectedDomain}
          onSelectDomain={handleDomainSelect}
          onStart={handleStartQuiz}
        />
        <button
          className="btn btn-secondary"
          onClick={() => {
            setGameState('mode-select');
            setSelectedMode(null);
            setSelectedDomain(null);
          }}
          style={{ marginTop: '20px' }}
        >
          ← Back to Mode Selection
        </button>
      </div>
    );
  }

  if (gameState === 'results') {
    if (!engine) {
      return (
        <div className="quiz-container">
          <div className="loading">Loading results...</div>
        </div>
      );
    }

    const history = engine.getHistory();
    const finalScore = engine.getScore();

    return (
      <div className="quiz-container">
        <Profile user={user} onSignOut={handleSignOut} />
        <ResultsDashboard
          history={history}
          finalScore={finalScore}
          user={user}
          onReset={resetQuiz}
          onViewHistory={() => setGameState('history')}
          questionTimes={questionTimes}
          streak={streak}
          selectedMode={selectedMode}
          selectedDomain={selectedDomain}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="quiz-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="header-content">
          <div className="header-branding">
            <img src="/braintrain logo.png" alt="Braintrain Labs" className="header-logo" />
            <h1>Braintrain Labs</h1>
          </div>
          <span className="mode-badge">{selectedMode} Mode</span>
        </div>
        <Profile user={user} onSignOut={handleSignOut} />
      </div>

      <ProgressBar
        currentQuestion={questionNumber}
        totalQuestions={engine?.maxQuestions || 20}
        avgTimePerQuestion={questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length : 0}
      />

      <div className="quiz-meta">
        <span>Score: {engine?.getScore() || 0}</span>
        {streak > 0 && <span className="streak">🔥 {streak} streak</span>}
        <button
          className="btn btn-secondary"
          onClick={handleEndQuiz}
          style={{ marginLeft: 'auto' }}
        >
          End Quiz
        </button>
      </div>

      <div className="question-card">
        <div className="question-badges">
          <span className="badge domain-badge" style={{
            backgroundColor: getDomainConfig(currentQuestion.domain).bgColor,
            color: getDomainConfig(currentQuestion.domain).color,
            borderColor: getDomainConfig(currentQuestion.domain).borderColor
          }}>
            <span className="badge-icon">{getDomainConfig(currentQuestion.domain).icon}</span>
            {getDomainConfig(currentQuestion.domain).name}
          </span>
          <span className="badge">Level {currentQuestion.difficulty}</span>
          <span className="badge">{currentQuestion.age_band}</span>
        </div>

        <h2 className="question-stem">{currentQuestion.stem}</h2>

        <div className="options-container">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              className={`option-button ${
                selectedOption === option.id ? 'selected' : ''
              } ${
                showFeedback && selectedOption === option.id
                  ? option.class === 'mastery'
                    ? 'correct'
                    : option.class === 'developing'
                    ? 'neutral'
                    : 'proficient-answer'
                  : ''
              }`}
              onClick={() => handleOptionSelect(option.id)}
              disabled={showFeedback}
            >
              <span className="option-id">{option.id}</span>
              <span className="option-text">{option.text}</span>
            </button>
          ))}
        </div>

        {showFeedback && feedback && (
          <div className={`feedback ${feedback.answerClass}`}>
            <h3>{feedback.title}</h3>
            <p>{feedback.explanation}</p>
            <p className="encouragement-text">{feedback.encouragement}</p>
            {feedback.answerClass !== 'mastery' && feedback.correctOption && (
              <p className="correct-answer-hint">
                <strong>Highest-scoring response:</strong> {feedback.correctOption.text}
              </p>
            )}
            <p className="score-change">
              Score: +{feedback.scoreDelta}
            </p>
            {feedback.encouragement && (
              <p className="encouragement-banner">{feedback.encouragement}</p>
            )}
          </div>
        )}

        <div className="button-container">
          {!showFeedback ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedOption}
            >
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
