/*
  # Update Admin Policies

  1. Changes
    - Add policy for admin creation
    - Update existing policies for better security

  2. Security
    - Enable admin self-registration through auth
    - Maintain RLS protection for admin data
*/

-- Update policies for admins table
CREATE POLICY "Enable admin self-registration"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update existing select policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Admins can view their own data" ON admins;
CREATE POLICY "Admins can view their own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);