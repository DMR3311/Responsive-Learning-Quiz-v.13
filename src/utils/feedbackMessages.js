export const getFeedbackMessage = (answerClass, domain, isCorrect) => {
  const explanations = {
    time: {
      mastery: {
        title: "Excellent future thinking!",
        explanation: "You understand that patience and delayed gratification lead to better outcomes. This shows strong time perspective reasoning.",
        encouragement: "This skill helps with long-term planning and goal achievement."
      },
      proficient: {
        title: "Good reasoning",
        explanation: "You're considering the time aspects, though there might be an alternative perspective to explore.",
        encouragement: "Keep thinking about how timing affects outcomes."
      },
      developing: {
        title: "Consider the longer view",
        explanation: "Immediate gratification often means missing out on better opportunities that require patience.",
        encouragement: "Try to think about what happens later, not just right now."
      }
    },
    social: {
      mastery: {
        title: "Strong social reasoning!",
        explanation: "You recognize fairness principles and how effort should be rewarded proportionally.",
        encouragement: "This shows mature understanding of social dynamics."
      },
      proficient: {
        title: "Reasonable approach",
        explanation: "You're thinking about social situations, but there may be a fairer solution.",
        encouragement: "Consider how different people are affected by decisions."
      },
      developing: {
        title: "Think about fairness",
        explanation: "Fair outcomes often require considering individual contributions and circumstances.",
        encouragement: "Put yourself in each person's shoes."
      }
    },
    evidence: {
      mastery: {
        title: "Excellent probabilistic thinking!",
        explanation: "You correctly evaluated the odds and made a decision based on evidence.",
        encouragement: "This analytical approach serves you well in decision-making."
      },
      proficient: {
        title: "Good analysis",
        explanation: "You're using some evidence, but the probabilities favor a different choice.",
        encouragement: "Try counting the actual chances for each outcome."
      },
      developing: {
        title: "Look at the numbers",
        explanation: "The evidence points to a clearer answer when you analyze the probabilities.",
        encouragement: "Count the favorable vs. unfavorable outcomes."
      }
    },
    logic: {
      mastery: {
        title: "Strong logical reasoning!",
        explanation: "You identified the logical pattern or rule that applies here.",
        encouragement: "This systematic thinking helps solve complex problems."
      },
      proficient: {
        title: "Partial logic",
        explanation: "Your reasoning has merit, but there's a more logically sound conclusion.",
        encouragement: "Look for the underlying rule or pattern."
      },
      developing: {
        title: "Check the logic",
        explanation: "The logical relationships here point to a different answer.",
        encouragement: "Break down the problem step by step."
      }
    },
    risk: {
      mastery: {
        title: "Smart risk assessment!",
        explanation: "You balanced potential gains against potential losses appropriately.",
        encouragement: "This careful evaluation prevents costly mistakes."
      },
      proficient: {
        title: "Reasonable caution",
        explanation: "You're considering risks, but there's a better balance to strike.",
        encouragement: "Weigh both the upside and downside carefully."
      },
      developing: {
        title: "Reconsider the risks",
        explanation: "The risk-reward ratio here suggests a different approach would be wiser.",
        encouragement: "Ask: what could go wrong, and is it worth it?"
      }
    },
    probability: {
      mastery: {
        title: "Great probability sense!",
        explanation: "You correctly evaluated which outcome is more likely based on the information.",
        encouragement: "This intuition for odds is very valuable."
      },
      proficient: {
        title: "Some probability awareness",
        explanation: "You're thinking about likelihood, but the math points elsewhere.",
        encouragement: "Try to compare the chances more precisely."
      },
      developing: {
        title: "Consider the odds",
        explanation: "When you calculate the actual probabilities, a clearer answer emerges.",
        encouragement: "Which scenario is mathematically more likely?"
      }
    },
    critical: {
      mastery: {
        title: "Excellent critical analysis!",
        explanation: "You identified the logical flaw or reasoning error in the argument. This shows strong critical thinking skills.",
        encouragement: "This ability to spot faulty reasoning is essential for sound decision-making."
      },
      proficient: {
        title: "Good analytical thinking",
        explanation: "You're questioning the argument, though there's a more precise way to identify the issue.",
        encouragement: "Keep analyzing the structure and assumptions of arguments."
      },
      developing: {
        title: "Examine the reasoning",
        explanation: "This argument contains a logical flaw. Look carefully at the assumptions and connections being made.",
        encouragement: "Ask yourself: does this conclusion really follow from the evidence?"
      }
    }
  };

  const domainFeedback = explanations[domain] || explanations.logic;
  const feedback = domainFeedback[answerClass] || domainFeedback.proficient;

  return feedback;
};

export const getEncouragementMessage = (streak, score, questionsAnswered) => {
  if (streak >= 5) {
    return `Amazing! ${streak} correct answers in a row! 🔥`;
  }

  if (streak >= 3) {
    return `Great streak! Keep it going! ⭐`;
  }

  return null;
};
