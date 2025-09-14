-- Add created_by column to track which user created each school
ALTER TABLE schools 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX idx_schools_created_by ON schools(created_by);

-- Update RLS policy to allow users to see all schools but only authenticated users can insert
DROP POLICY IF EXISTS "Allow authenticated users to insert schools" ON schools;
DROP POLICY IF EXISTS "Allow public read access to schools" ON schools;

-- Allow public read access to schools
CREATE POLICY "Allow public read access to schools" ON schools
    FOR SELECT USING (true);

-- Allow authenticated users to insert schools
CREATE POLICY "Allow authenticated users to insert schools" ON schools
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update schools they created
CREATE POLICY "Allow users to update their own schools" ON schools
    FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete schools they created
CREATE POLICY "Allow users to delete their own schools" ON schools
    FOR DELETE USING (auth.uid() = created_by);
