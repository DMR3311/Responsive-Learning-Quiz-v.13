import React from "react";

function Question({ data, selectedOption, setSelectedOption }) {
  if (!data) return null;

  return (
    <div className="question-block">
      <h3 className="question-title">{data.question}</h3>

      <ul className="options-list">
        {data.options.map((opt, i) => (
          <li key={i}>
            <button
              className={\`option-btn \${selectedOption === opt ? "selected" : ""}\`}
              onClick={() => setSelectedOption(opt)}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Question;
