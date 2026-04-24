/**
 * Shared constants for field whitelisting and validation.
 */

export const ALLOWED_PACKAGE_FIELDS = ['name', 'price', 'speed', 'description'];

export const ALLOWED_INVENTORY_FIELDS = ['name', 'stock', 'unit', 'category'];

export const ALLOWED_CUSTOMER_FIELDS = [
  'name', 'ktp', 'phone', 'alt_phone', 'packet', 'address',
  'install_date', 'username', 'mac_address', 'damping',
  'lat', 'lng', 'photo_ktp', 'photo_rumah', 'email',
];

export const ALLOWED_WORK_ORDER_FIELDS = [
  'title', 'status', 'customer_id', 'employee_id', 'ket', 'payment_status'
];

export const ALLOWED_EMPLOYEE_FIELDS = [
  'name', 'employee_id', 'email', 'position', 'status',
  'birth_place', 'birth_date', 'address', 'join_date',
  'education', 'training', 'bpjs', 'role_id', 'base_salary', 'target_monthly_points', 'is_bpjs_enrolled'
];

export const ALLOWED_SALARY_CONFIG_FIELDS = [
  'employee_id', 'position_allowance', 'additional_allowance', 'quota_allowance',
  'education_allowance', 'transport_meal_allowance', 'bpjs_company_contribution',
  'effective_from', 'effective_to'
];
