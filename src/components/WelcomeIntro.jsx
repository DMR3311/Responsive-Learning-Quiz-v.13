import { useState } from 'react';
import { ProgressPreview } from './ProgressPreview';
import { DifficultySelector } from './DifficultySelector';
import { ParticleBackground } from './ParticleBackground';

export function WelcomeIntro({ onStart, userName }) {
  const [difficulty, setDifficulty] = useState('adaptive');
  return (
    <div className="welcome-intro">
      <ParticleBackground />
      <div className="welcome-card">
        <div className="welcome-header">
          <h1>Let's Find Your Learning Super Powers!</h1>
          <p className="welcome-subtitle">
            Hi {userName}! Discover your strengths and level up your thinking.
          </p>
        </div>

        <div className="welcome-content">
          <div className="intro-section">
            <div className="intro-graphic">
              <img src="/braintrain logo.png" alt="Braintrain Labs" className="intro-logo" />
            </div>
            <h2>Master Multiple Domains</h2>
            <p>
              Challenge yourself across time perspective, social reasoning, evidence analysis,
              logic, risk assessment, and probability. Each question sharpens your mind.
            </p>
          </div>

          <div className="intro-section">
            <div className="intro-graphic">
              <img src="/braintrain logo.png" alt="Braintrain Labs" className="intro-logo" />
            </div>
            <h2>Smart Adaptive System</h2>
            <p>
              Our AI-powered engine adapts to you in real-time. The better you perform,
              the more challenging it gets. Instant feedback accelerates your growth.
            </p>
          </div>

        </div>

        <DifficultySelector onSelect={setDifficulty} selectedDifficulty={difficulty} />

        <div className="welcome-footer">
          <button
            className="btn btn-primary btn-large btn-ready"
            onClick={() => onStart(difficulty)}
            disabled={!difficulty}
          >
            Start the Quiz
          </button>
        </div>

        <ProgressPreview />
      </div>
    </div>
  );
}
