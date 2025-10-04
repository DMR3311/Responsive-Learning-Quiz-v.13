/*
  # Allow Anonymous Quiz Sessions with Email

  This migration modifies the Row Level Security (RLS) policies to allow
  unauthenticated users to create quiz sessions and submit answers.

  ## Changes Made

  1. **quiz_sessions table**
     - Add `email` column to capture user identity without authentication
     - Make `user_id` nullable to allow anonymous sessions
     - Add policy to allow anonymous inserts with email
     - Keep existing authenticated user policies

  2. **quiz_answers table**
     - Add policy to allow anonymous inserts if session exists
     - Keep existing authenticated user policies

  3. **profiles table**
     - No changes needed (remains authenticated only)

  4. **domain_stats table**
     - No changes needed (remains authenticated only)

  ## Security Considerations

  - Anonymous users can INSERT sessions and answers
  - Anonymous users CANNOT read any data (SELECT remains blocked)
  - Email capture provides identity tracking without authentication
  - Authenticated users retain full CRUD on their own data
  - Service role retains full access via admin policies
*/

-- Add email column to quiz_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'email'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN email text;
  END IF;
END $$;

-- Make user_id nullable to allow anonymous sessions
ALTER TABLE quiz_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing insert policy for authenticated users on quiz_sessions
DROP POLICY IF EXISTS "Users can insert own sessions" ON quiz_sessions;

-- Recreate authenticated user insert policy
CREATE POLICY "Authenticated users can insert own sessions"
  ON quiz_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add policy for anonymous inserts on quiz_sessions
CREATE POLICY "Anonymous users can insert sessions with email"
  ON quiz_sessions FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND user_id IS NULL
  );

-- Drop existing insert policy for authenticated users on quiz_answers
DROP POLICY IF EXISTS "Users can insert own answers" ON quiz_answers;

-- Recreate authenticated user insert policy for quiz_answers
CREATE POLICY "Authenticated users can insert own answers"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- Add policy for anonymous inserts on quiz_answers
CREATE POLICY "Anonymous users can insert answers"
  ON quiz_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_answers.session_id
    )
  );

-- Update the update_domain_stats function to handle anonymous sessions
CREATE OR REPLACE FUNCTION public.update_domain_stats()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM quiz_sessions
  WHERE id = NEW.session_id;

  -- Only update domain stats if there's a user_id (authenticated users)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO domain_stats (user_id, domain, total_questions, optimal_count, typical_count, regressive_count)
    VALUES (
      v_user_id,
      NEW.domain,
      1,
      CASE WHEN NEW.answer_class = 'mastery' THEN 1 ELSE 0 END,
      CASE WHEN NEW.answer_class = 'proficient' THEN 1 ELSE 0 END,
      CASE WHEN NEW.answer_class = 'developing' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, domain)
    DO UPDATE SET
      total_questions = domain_stats.total_questions + 1,
      optimal_count = domain_stats.optimal_count + CASE WHEN NEW.answer_class = 'mastery' THEN 1 ELSE 0 END,
      typical_count = domain_stats.typical_count + CASE WHEN NEW.answer_class = 'proficient' THEN 1 ELSE 0 END,
      regressive_count = domain_stats.regressive_count + CASE WHEN NEW.answer_class = 'developing' THEN 1 ELSE 0 END,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
