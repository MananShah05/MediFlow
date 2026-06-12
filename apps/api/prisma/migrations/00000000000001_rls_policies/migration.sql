-- Enable RLS and apply tenant isolation policies for all tenant-scoped tables

-- 1. users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON "users"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 2. roles
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_roles ON "roles"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 3. role_permissions
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_role_permissions ON "role_permissions"
  USING (role_id IN (SELECT id FROM roles WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));

-- 4. user_roles
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_user_roles ON "user_roles"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 5. patients
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patients ON "patients"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 6. patient_profiles
ALTER TABLE "patient_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_profiles ON "patient_profiles"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 7. doctors
ALTER TABLE "doctors" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_doctors ON "doctors"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 8. nurses
ALTER TABLE "nurses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_nurses ON "nurses"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 9. departments
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_departments ON "departments"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 10. appointments
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_appointments ON "appointments"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 11. encounters
ALTER TABLE "encounters" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_encounters ON "encounters"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 12. admissions
ALTER TABLE "admissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_admissions ON "admissions"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 13. wards
ALTER TABLE "wards" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_wards ON "wards"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 14. rooms
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_rooms ON "rooms"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 15. beds
ALTER TABLE "beds" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_beds ON "beds"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 16. vitals
ALTER TABLE "vitals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_vitals ON "vitals"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 17. diagnoses
ALTER TABLE "diagnoses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_diagnoses ON "diagnoses"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 18. prescriptions
ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_prescriptions ON "prescriptions"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 19. prescription_items
ALTER TABLE "prescription_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_prescription_items ON "prescription_items"
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));

-- 20. medication_administration
ALTER TABLE "medication_administration" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_med_admin ON "medication_administration"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 21. lab_orders
ALTER TABLE "lab_orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_lab_orders ON "lab_orders"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 22. lab_results
ALTER TABLE "lab_results" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_lab_results ON "lab_results"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 23. nursing_tasks
ALTER TABLE "nursing_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_nursing_tasks ON "nursing_tasks"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 24. nursing_handoffs
ALTER TABLE "nursing_handoffs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_nursing_handoffs ON "nursing_handoffs"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 25. notes
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notes ON "notes"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 26. files
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_files ON "files"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 27. invoices
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoices ON "invoices"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 28. invoice_items
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoice_items ON "invoice_items"
  USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = current_setting('app.current_tenant_id')::uuid));

-- 29. payments
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_payments ON "payments"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 30. consents
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_consents ON "consents"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 31. consent_events
ALTER TABLE "consent_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_consent_events ON "consent_events"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 32. audit_logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON "audit_logs"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 33. sessions
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sessions ON "sessions"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 34. devices
ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_devices ON "devices"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 35. login_attempts
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_login_attempts ON "login_attempts"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 36. notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notifications ON "notifications"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 37. retention_policies
ALTER TABLE "retention_policies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_retention_policies ON "retention_policies"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 38. support_tickets
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_support_tickets ON "support_tickets"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 39. incident_reports
ALTER TABLE "incident_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_incident_reports ON "incident_reports"
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
