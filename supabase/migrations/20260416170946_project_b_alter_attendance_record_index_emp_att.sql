ALTER TABLE attendance_records 
ADD CONSTRAINT employee_attendance_unique 
UNIQUE (employee_id, attendance_date);