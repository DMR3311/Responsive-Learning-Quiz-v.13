import { sendToWordPress } from './wordpress';
import { sendToGoogleSheets, formatQuizDataForSheets } from './googleSheets';

export async function reportQuizResults({
  user,
  selectedMode,
  selectedDomain,
  history,
  finalScore,
  optimalAnswers,
  questionTimes,
}) {
  const summary = {
    score: finalScore,
    totalQuestions: history.length,
    optimalAnswers,
    mode: selectedMode,
    domain: selectedDomain,
    userEmail: user?.email || user?.user_metadata?.email || null,
    userName:
      user?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      null,
    userId: user?.id || null,
    timestamp: new Date().toISOString(),
    history,
    questionTimes,
  };

  try {
    const wpRes = await sendToWordPress(summary);
    if (wpRes && wpRes.success) {
      return { success: true, target: 'wordpress' };
    }
  } catch (err) {
    console.error('WordPress reporting failed:', err);
  }

  try {
    const sheetData = formatQuizDataForSheets(
      user,
      selectedMode,
      history,
      finalScore,
      questionTimes
    );
    const gsRes = await sendToGoogleSheets(sheetData);
    if (gsRes && gsRes.success) {
      return { success: true, target: 'google_sheets' };
    }
  } catch (err) {
    console.error('Google Sheets reporting failed:', err);
  }

  try {
    const pendingRaw = localStorage.getItem('pendingReports');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
    pending.push({ summary, createdAt: Date.now() });
    localStorage.setItem('pendingReports', JSON.stringify(pending));
  } catch (err) {
    console.error('Failed to store pending quiz report locally:', err);
  }

  return { success: false, target: 'none' };
}
