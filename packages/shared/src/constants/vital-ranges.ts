/**
 * Vital sign physiologically plausible ranges for server-side validation.
 * Values outside these ranges are rejected with HTTP 422 per R-DQ-005.
 */
export const VITAL_RANGES = {
  systolicBp: { min: 40, max: 280, unit: "mmHg", label: "Systolic Blood Pressure" },
  diastolicBp: { min: 20, max: 180, unit: "mmHg", label: "Diastolic Blood Pressure" },
  pulse: { min: 20, max: 250, unit: "bpm", label: "Pulse Rate" },
  temperature: { min: 33, max: 42, unit: "°C", label: "Temperature (Celsius)" },
  temperatureF: { min: 91.4, max: 107.6, unit: "°F", label: "Temperature (Fahrenheit)" },
  spo2: { min: 70, max: 100, unit: "%", label: "SpO2" },
  respiratoryRate: { min: 4, max: 60, unit: "breaths/min", label: "Respiratory Rate" },
  painScore: { min: 0, max: 10, unit: "NRS", label: "Pain Score" },
  bloodGlucose: { min: 20, max: 600, unit: "mg/dL", label: "Blood Glucose" },
  weightKg: { min: 0.3, max: 500, unit: "kg", label: "Weight" },
  heightCm: { min: 20, max: 280, unit: "cm", label: "Height" },
} as const;

export type VitalParameter = keyof typeof VITAL_RANGES;

/**
 * Critical vital thresholds that trigger automatic alerts per R-NOTIF-003.
 * Values outside these ranges set is_critical = true on the vitals record.
 */
export const CRITICAL_VITAL_THRESHOLDS = {
  systolicBp: { low: 80, high: 200 },
  diastolicBp: { low: 40, high: 120 },
  pulse: { low: 40, high: 150 },
  temperature: { low: 35, high: 40 },
  spo2: { low: 88, high: 100 },
  respiratoryRate: { low: 8, high: 30 },
  bloodGlucose: { low: 50, high: 400 },
} as const;

export type CriticalVitalParameter = keyof typeof CRITICAL_VITAL_THRESHOLDS;
