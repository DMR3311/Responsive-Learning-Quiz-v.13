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
          <h1>Unlock Your Cognitive Potential</h1>
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

          <div className="intro-section">
            <div className="intro-graphic">
              <img src="/braintrain logo.png" alt="Braintrain Labs" className="intro-logo" />
            </div>
            <h2>Deep Insights Await</h2>
            <p>
              The more you engage, the better your results. Complete the assessment to unlock
              a comprehensive performance report with actionable insights tailored just for you.
            </p>
          </div>

          <div className="intro-section">
            <div className="intro-graphic">
              <img src="/braintrain logo.png" alt="Braintrain Labs" className="intro-logo" />
            </div>
            <h2>Pro Tips</h2>
            <ul className="tips-list">
              <li>Focus deeply on each question</li>
              <li>Think long-term, not just immediate</li>
              <li>Trust logic and evidence over gut feelings</li>
              <li>Quality thinking beats speed every time</li>
            </ul>
          </div>
        </div>

        <DifficultySelector onSelect={setDifficulty} selectedDifficulty={difficulty} />

        <ProgressPreview />

        <div className="welcome-footer">
          <button
            className="btn btn-primary btn-large btn-ready"
            onClick={() => onStart(difficulty)}
            disabled={!difficulty}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
