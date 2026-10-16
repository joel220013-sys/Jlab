export interface User {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: string;
  laboratory_id?: string;
  laboratory_name?: string;
}

export interface Patient {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  age_years: number;
  age_months: number;
  blood_group?: string;
  created_at: string;
}

export interface TestCatalogItem {
  id: string;
  code: string;
  name: string;
  category_name: string;
  specimen_type: string;
  tube_color: string;
  standard_price: number;
  expected_tat_minutes: number;
  methodology?: string;
}

export interface SampleItem {
  id: string;
  barcode: string;
  specimen_type: string;
  tube_color: string;
  status: string;
  collected_at?: string;
}

export interface OrderItem {
  id: string;
  order_number: string;
  lab_number: string;
  patient_id: string;
  patient_name: string;
  patient_uhid: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  invoice_status: string;
  samples: SampleItem[];
  created_at: string;
}

export interface ParameterRow {
  parameter_id: string;
  code: string;
  name: string;
  unit?: string;
  value_type: string;
  current_numeric?: number | null;
  current_text?: string | null;
  reference_low?: number | null;
  reference_high?: number | null;
  reference_text?: string | null;
  delta_previous_value?: number | null;
  delta_previous_date?: string | null;
  flag: string;
  is_bold_highlight: boolean;
  is_differential_part: boolean;
}

export interface WorklistTestItem {
  test_result_id: string;
  order_id: string;
  order_number: string;
  lab_number: string;
  barcode: string;
  patient_name: string;
  patient_uhid: string;
  patient_age_gender: string;
  doctor_name?: string;
  test_name: string;
  test_code: string;
  specimen_type: string;
  status: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  order_number: string;
  lab_number: string;
  patient_name: string;
  patient_phone: string;
  total: number;
  paid_amount: number;
  balance: number;
  status: string;
  payment_method: string;
  is_credit_override: boolean;
  created_at: string;
}
