/*
  # Add Image Support to Reports Table

  1. Changes
    - Add `image_url` column to reports table to store uploaded image URLs
    - Update RLS policies to allow image uploads

  2. Security
    - Maintain existing RLS policies
    - Ensure secure access to images
*/

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS image_url text;

-- No need to modify RLS as existing policies cover the new column