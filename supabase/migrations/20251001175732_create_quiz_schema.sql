/*
  # BrainTrain Quiz Database Schema

  ## Overview
  This migration creates the core database structure for the BrainTrain adaptive quiz platform.
  It enables user authentication, quiz result tracking, performance analytics, and progress persistence.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to authentication
  - `id` (uuid, primary key) - Links to auth.users
  - `username` (text, unique) - Display name
  - `created_at` (timestamptz) - Account creation time
  - `total_quizzes` (integer) - Number of completed quizzes
  - `total_score` (integer) - Lifetime cumulative score
  - `current_streak` (integer) - Consecutive days with quiz activity
  - `longest_streak` (integer) - Best streak achieved
  - `last_quiz_date` (date) - Most recent quiz completion

  ### 2. `quiz_sessions`
  Individual quiz attempts/sessions
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, foreign key) - Links to profiles
  - `started_at` (timestamptz) - Session start time
  - `completed_at` (timestamptz) - Session completion time
  - `final_score` (integer) - Total score achieved
  - `questions_answered` (integer) - Number of questions completed
  - `optimal_answers` (integer) - Count of advanced/optimal responses
  - `mode` (text) - Quiz mode (practice, timed, challenge)

  ### 3. `quiz_answers`
  Individual question responses within sessions
  - `id` (uuid, primary key) - Unique answer identifier
  - `session_id` (uuid, foreign key) - Links to quiz_sessions
  - `question_id` (text) - Question identifier from JSON
  - `domain` (text) - Cognitive domain (time, social, evidence, risk, metacognition)
  - `selected_option` (text) - Option ID chosen (A, B, C)
  - `answer_class` (text) - Classification (advanced, typical, regressive)
  - `score_delta` (integer) - Points gained/lost
  - `time_taken_seconds` (integer) - Response time
  - `answered_at` (timestamptz) - Timestamp of answer

  ### 4. `domain_stats`
  Aggregated performance by cognitive domain per user
  - `id` (uuid, primary key) - Unique stat identifier
  - `user_id` (uuid, foreign key) - Links to profiles
  - `domain` (text) - Cognitive domain name
  - `total_questions` (integer) - Questions answered in domain
  - `optimal_count` (integer) - Advanced answers in domain
  - `typical_count` (integer) - Typical answers in domain
  - `regressive_count` (integer) - Regressive answers in domain
  - `avg_score_delta` (numeric) - Average points per question
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only read/write their own data
  - Authenticated access required for all operations

  ## Important Notes
  1. Profiles are created automatically via trigger when users sign up
  2. Domain stats are updated via trigger when answers are inserted
  3. All timestamps use UTC timezone
  4. Foreign key constraints ensure data integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  created_at timestamptz DEFAULT now(),
  total_quizzes integer DEFAULT 0,
  total_score integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_quiz_date date
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  final_score integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  optimal_answers integer DEFAULT 0,
  mode text DEFAULT 'practice'
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON quiz_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON quiz_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON quiz_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  domain text NOT NULL,
  selected_option text NOT NULL,
  answer_class text NOT NULL,
  score_delta integer NOT NULL,
  time_taken_seconds integer,
  answered_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers"
  ON quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- Create domain_stats table
CREATE TABLE IF NOT EXISTS domain_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  domain text NOT NULL,
  total_questions integer DEFAULT 0,
  optimal_count integer DEFAULT 0,
  typical_count integer DEFAULT 0,
  regressive_count integer DEFAULT 0,
  avg_score_delta numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, domain)
);

ALTER TABLE domain_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own domain stats"
  ON domain_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domain stats"
  ON domain_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domain stats"
  ON domain_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update domain stats when answers are inserted
CREATE OR REPLACE FUNCTION public.update_domain_stats()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM quiz_sessions
  WHERE id = NEW.session_id;

  INSERT INTO domain_stats (user_id, domain, total_questions, optimal_count, typical_count, regressive_count)
  VALUES (
    v_user_id,
    NEW.domain,
    1,
    CASE WHEN NEW.answer_class = 'advanced' THEN 1 ELSE 0 END,
    CASE WHEN NEW.answer_class = 'typical' THEN 1 ELSE 0 END,
    CASE WHEN NEW.answer_class = 'regressive' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, domain)
  DO UPDATE SET
    total_questions = domain_stats.total_questions + 1,
    optimal_count = domain_stats.optimal_count + CASE WHEN NEW.answer_class = 'advanced' THEN 1 ELSE 0 END,
    typical_count = domain_stats.typical_count + CASE WHEN NEW.answer_class = 'typical' THEN 1 ELSE 0 END,
    regressive_count = domain_stats.regressive_count + CASE WHEN NEW.answer_class = 'regressive' THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update domain stats
DROP TRIGGER IF EXISTS on_answer_inserted ON quiz_answers;
CREATE TRIGGER on_answer_inserted
  AFTER INSERT ON quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_domain_stats();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_domain ON quiz_answers(domain);
CREATE INDEX IF NOT EXISTS idx_domain_stats_user_id ON domain_stats(user_id);