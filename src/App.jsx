import React, { useState, useEffect, useRef } from 'react';
import Question from './components/Question';
import Result from './components/Result';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('start');   // start | playing | results
  const [engineInstance, setEngineInstance] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [quizScore, setQuizScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const answerRef = useRef(null);

  // Load questions
  useEffect(() => {
    fetch('/questions.json')
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  }, []);

  // Auto-resize iframe broadcaster
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ quizHeight: height }, '*');
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

  const startQuiz = () => {
    setGameState('playing');
    setQuestionIndex(0);
    setQuizScore(0);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;

    const currentQuestion = questions[questionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;

    setFeedback(isCorrect ? 'Correct!' : 'Incorrect');
    setShowFeedback(true);

    if (isCorrect) setQuizScore((prev) => prev + 1);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);

    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      completeQuiz(engineInstance);
    }
  };

  // Complete quiz and send data to API
  const completeQuiz = async (engineInstance) => {
    try {
      const finalScore = quizScore;
      const total = questions.length;

      await fetch('https://braintrain.org/wp-json/braintrain/v1/submit-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: finalScore,
          total: total,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Quiz submission failed:', err);
    }

    setGameState('results');
  }; // <-- FIXED: only ONE closing brace here.

  // ---------- RENDER ---------- //
  if (gameState === 'start') {
    return (
      <div className="start-screen">
        <h1>Learning Superpowers Quiz</h1>
        <button className="btn btn-primary" onClick={startQuiz}>
          Start Quiz
        </button>
      </div>
    );
  }

  if (gameState === 'results') {
    return <Result score={quizScore} total={questions.length} />;
  }

  // ---------- PLAYING STATE ---------- //
  const currentQuestion = questions[questionIndex];

  return (
    <div className="quiz-container">

      <div className="question-header">
        <h2>
          Question {questionIndex + 1} of {questions.length}
        </h2>
      </div>

      <div className="question-content">
        {currentQuestion && (
          <Question
            data={currentQuestion}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
        )}

        {showFeedback && (
          <div className="feedback">
            <p>{feedback}</p>
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
