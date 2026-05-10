DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'employee_salary_configs_employee_id_effective_from_key'
    ) THEN
        ALTER TABLE public.employee_salary_configs
        ADD CONSTRAINT employee_salary_configs_employee_id_effective_from_key UNIQUE (employee_id, effective_from);
    END IF;
END $$;
