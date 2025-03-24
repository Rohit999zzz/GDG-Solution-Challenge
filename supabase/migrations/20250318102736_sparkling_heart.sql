/*
  # Create Reports and Admins Tables

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `reports`
      - `id` (uuid, primary key)
      - `type` (text)
      - `description` (text)
      - `location` (text)
      - `date` (date)
      - `verified` (boolean)
      - `verification_result` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access to reports
    - Add policy for admin authentication
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('harassment', 'discrimination', 'assault', 'other')),
  description text NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
  location text NOT NULL CHECK (length(location) >= 3 AND length(location) <= 200),
  date date NOT NULL,
  verified boolean DEFAULT false,
  verification_result text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
CREATE POLICY "Admins can view their own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for reports table
CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );