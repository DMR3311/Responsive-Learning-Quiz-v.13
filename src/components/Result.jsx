import React from "react";

function Result({ score, total }) {
  const percent = Math.round((score / total) * 100);

  return (
    <div className="result-screen">
      <h2 className="result-title">Your Results</h2>

      <div className="result-box">
        <p className="score-text">
          You scored <strong>{score}</strong> out of <strong>{total}</strong>
        </p>
        <p className="percent-text">{percent}% correct</p>
      </div>

      <p className="thank-you">
        Thank you for completing the Learning Superpowers Quiz!
      </p>
    </div>
  );
}

export default Result;

