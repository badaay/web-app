-- Add created_by column to overtime_records if it doesn't exist
ALTER TABLE public.overtime_records 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_overtime_records_created_by ON public.overtime_records(created_by);
