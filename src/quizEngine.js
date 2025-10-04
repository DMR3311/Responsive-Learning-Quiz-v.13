export class QuizEngine {
  constructor(items, mode = 'adaptive', domainFilter = null) {
    this.allItems = items;
    this.mode = mode;
    this.domainFilter = domainFilter;
    this.currentAgeBand = '7-12';
    this.currentDifficulty = 1;
    this.lastDomain = null;
    this.domainRepeatCount = 0;
    this.usedItemIds = new Set();
    this.cooldownIds = new Set();
    this.score = 0;
    this.history = [];
    this.maxQuestions = this.getMaxQuestions();
    this.masteryStreak = 0; // Track consecutive mastery answers
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getMaxQuestions() {
    switch(this.mode) {
      case 'quick':
        return 15;
      case 'comprehensive':
        return 30;
      case 'domain':
        return 10;
      case 'adaptive':
      default:
        return 20;
    }
  }

  isQuizComplete() {
    return this.history.length >= this.maxQuestions;
  }

  getNextQuestion() {
    if (this.isQuizComplete()) {
      return null;
    }

    let candidates = this.allItems.filter(item => {
      if (this.usedItemIds.has(item.id)) return false;
      if (this.cooldownIds.has(item.id)) return false;
      if (item.age_band !== this.currentAgeBand) return false;

      // Filter by domain if domain mode is active
      if (this.mode === 'domain' && this.domainFilter) {
        if (item.domain !== this.domainFilter) return false;
      }

      if (this.mode === 'adaptive' || this.mode === 'domain') {
        if (Math.abs(item.difficulty - this.currentDifficulty) > 1) return false;
      } else if (this.mode === 'quick') {
        if (item.difficulty !== 2) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      candidates = this.allItems.filter(item => {
        if (this.usedItemIds.has(item.id)) return false;
        // Maintain domain filter even in fallback
        if (this.mode === 'domain' && this.domainFilter) {
          if (item.domain !== this.domainFilter) return false;
        }
        return true;
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    const sameDomainCandidates = candidates.filter(item => item.domain === this.lastDomain);

    if (this.lastDomain && this.domainRepeatCount < 2 && sameDomainCandidates.length > 0) {
      candidates = sameDomainCandidates;
    } else {
      candidates = candidates.filter(item => item.domain !== this.lastDomain);
      if (candidates.length === 0) {
        candidates = this.allItems.filter(item => {
          if (this.usedItemIds.has(item.id)) return false;
          // Maintain domain filter even in fallback
          if (this.mode === 'domain' && this.domainFilter) {
            if (item.domain !== this.domainFilter) return false;
          }
          return true;
        });
      }
    }

    const selectedItem = candidates[Math.floor(Math.random() * candidates.length)];
    this.usedItemIds.add(selectedItem.id);

    const shuffledOptions = this.shuffleArray(selectedItem.options);
    const labels = ['A', 'B', 'C'];

    const remappedOptions = shuffledOptions.map((option, index) => ({
      ...option,
      originalId: option.id,
      id: labels[index]
    }));

    const shuffledItem = {
      ...selectedItem,
      options: remappedOptions,
      originalOptions: selectedItem.options
    };

    return shuffledItem;
  }

  submitAnswer(question, selectedOptionId) {
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    if (!selectedOption) return null;

    let scoreDelta = selectedOption.score_delta;
    const answerClass = selectedOption.class;

    // Award bonus points for mastering Level 3 (Explorer) questions
    if (question.difficulty === 3 && answerClass === 'mastery') {
      scoreDelta += 5;
    }

    this.score += scoreDelta;

    this.history.push({
      questionId: question.id,
      domain: question.domain,
      difficulty: question.difficulty,
      selectedOption: selectedOptionId,
      answerClass: answerClass,
      scoreDelta: scoreDelta
    });

    // Update mastery streak for Explorer mode logic
    if (answerClass === 'mastery') {
      this.masteryStreak++;
    } else {
      this.masteryStreak = 0;
    }

    this.applyRouting(question, answerClass);

    if (question.domain === this.lastDomain) {
      this.domainRepeatCount++;
    } else {
      this.lastDomain = question.domain;
      this.domainRepeatCount = 1;
    }

    return {
      correct: answerClass === question.key.optimal_class,
      answerClass: answerClass,
      scoreDelta: scoreDelta
    };
  }

  applyRouting(question, answerClass) {
    if (this.mode !== 'adaptive' && this.mode !== 'domain') {
      return;
    }

    const rules = question.routing_rules;
    let routing;

    if (answerClass === 'developing') {
      routing = rules.on_developing;
    } else if (answerClass === 'proficient') {
      routing = rules.on_proficient;
    } else if (answerClass === 'mastery') {
      routing = rules.on_mastery;
    }

    if (!routing) return;

    if (routing.age_shift !== 0) {
      const ageBands = ['7-12', '13-19'];
      const currentIndex = ageBands.indexOf(this.currentAgeBand);
      const newIndex = Math.max(0, Math.min(ageBands.length - 1, currentIndex + routing.age_shift));
      this.currentAgeBand = ageBands[newIndex];
    }

    // Explorer Mode: Lock difficulty at 3 when mastery streak >= 5
    if (this.masteryStreak >= 5) {
      this.currentDifficulty = 3;
    } else if (answerClass !== 'mastery' && question.difficulty === 3) {
      // Special case: Non-mastery on Explorer question reduces to difficulty 2
      this.currentDifficulty = 2;
    } else if (routing.difficulty_shift !== 0) {
      // Apply normal routing rules for difficulty shifts
      this.currentDifficulty = Math.max(1, Math.min(3, this.currentDifficulty + routing.difficulty_shift));
    }

    if (rules.cooldown_ids && rules.cooldown_ids.length > 0) {
      rules.cooldown_ids.forEach(id => this.cooldownIds.add(id));
    }
  }

  getScore() {
    return this.score;
  }

  getHistory() {
    return this.history;
  }

  reset() {
    this.currentAgeBand = '7-12';
    this.currentDifficulty = 1;
    this.lastDomain = null;
    this.domainRepeatCount = 0;
    this.usedItemIds.clear();
    this.cooldownIds.clear();
    this.score = 0;
    this.history = [];
    this.masteryStreak = 0;
  }

  getMasteryStreak() {
    return this.masteryStreak;
  }
}
