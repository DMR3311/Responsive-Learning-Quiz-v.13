/*
  # Add Admin Access Policies

  1. Changes
    - Add service role policies for admin dashboard access
    - Allow service_role to read all sessions, answers, profiles, and domain stats
    - This enables the admin dashboard to fetch all user data for reporting

  2. Security
    - Only applies to service_role (backend/admin access)
    - Regular authenticated users still restricted to their own data
*/

-- Allow service role to read all profiles
CREATE POLICY "Service role can read all profiles"
  ON profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to read all quiz sessions
CREATE POLICY "Service role can read all sessions"
  ON quiz_sessions
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to read all quiz answers
CREATE POLICY "Service role can read all answers"
  ON quiz_answers
  FOR SELECT
  TO service_role
  USING (true);

-- Allow service role to read all domain stats
CREATE POLICY "Service role can read all domain stats"
  ON domain_stats
  FOR SELECT
  TO service_role
  USING (true);
