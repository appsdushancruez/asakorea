-- Create the exam_year_changes table
CREATE TABLE exam_year_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  new_exam_year INTEGER NOT NULL,
  fee_adjustment TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, new_exam_year)
);

-- Enable Row Level Security
ALTER TABLE exam_year_changes ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts for authenticated users
CREATE POLICY "Allow inserts for authenticated users" ON exam_year_changes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create a policy to allow selects for authenticated users
CREATE POLICY "Allow selects for authenticated users" ON exam_year_changes
  FOR SELECT TO authenticated
  USING (true);
