-- Migration: 021_app_settings_salary.sql
INSERT INTO public.app_settings (setting_key, setting_value, setting_group, description) VALUES
('work_start_time',        '08:00',   'payroll', 'Daily work start time for attendance tracking'),
('late_rate_per_hour',     '20000',   'payroll', 'Deduction rate per hour of lateness (IDR)'),
('late_max_daily',         '20000',   'payroll', 'Maximum daily late deduction (IDR)'),
('overtime_start_time',    '16:30',   'payroll', 'Overtime starts after this time'),
('overtime_rate_per_hour', '10000',   'payroll', 'Overtime pay rate per hour (IDR)'),
('point_deduction_rate',   '11600',   'payroll', 'Deduction per point below monthly target (IDR)'),
('bpjs_fixed_amount',      '194040',  'payroll', 'Fixed BPJS Ketenagakerjaan deduction amount (IDR)')
ON CONFLICT (setting_key) DO NOTHING;
