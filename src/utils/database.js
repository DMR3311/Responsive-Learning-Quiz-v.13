import { supabase } from '../lib/supabase';

export async function createQuizSession(userId, mode, email = null) {
  try {
    if (!supabase) return null;

    const sessionData = {
      mode: mode || 'practice',
      started_at: new Date().toISOString()
    };

    if (userId && userId !== 'guest') {
      sessionData.user_id = userId;
    } else if (email) {
      sessionData.email = email;
    } else {
      return null;
    }

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert(sessionData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error creating session:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating quiz session:', error);
    return null;
  }
}

export async function saveQuizAnswer(sessionId, answer) {
  try {
    if (!sessionId) return null;
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('quiz_answers')
      .insert({
        session_id: sessionId,
        question_id: answer.questionId,
        domain: answer.domain,
        selected_option: answer.selectedOption,
        answer_class: answer.answerClass,
        score_delta: answer.scoreDelta,
        time_taken_seconds: answer.timeTaken,
        answered_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quiz answer:', error);
    return null;
  }
}

export async function completeQuizSession(sessionId, finalScore, questionsAnswered, optimalAnswers) {
  try {
    if (!sessionId) return null;
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('quiz_sessions')
      .update({
        completed_at: new Date().toISOString(),
        final_score: finalScore,
        questions_answered: questionsAnswered,
        optimal_answers: optimalAnswers
      })
      .eq('id', sessionId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing quiz session:', error);
    return null;
  }
}

export async function getUserProfile(userId) {
  try {
    if (!userId || userId === 'guest') return null;
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function getUserDomainStats(userId) {
  try {
    if (!userId || userId === 'guest') return [];
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('domain_stats')
      .select('*')
      .eq('user_id', userId)
      .order('domain');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting domain stats:', error);
    return [];
  }
}

export async function getUserQuizHistory(userId, limit = 10) {
  try {
    if (!userId || userId === 'guest') return [];
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        quiz_answers (
          question_id,
          domain,
          selected_option,
          answer_class,
          score_delta,
          time_taken_seconds,
          answered_at
        )
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting quiz history:', error);
    return [];
  }
}
