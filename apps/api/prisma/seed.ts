import { PrismaClient, UserStatus, TenantType, TenantStatus, TenantTier, ComplianceProfile, OrgType, AppointmentStatus, AppointmentType, BookingChannel, EncounterStatus, EncounterType, Gender, BloodGroup, RegistrationType, LabOrderStatus, LabPriority, DepartmentType, WardType, RoomType, BedStatus, BedType, ShiftType, MedicationAdminStatus, NursingTaskType, NursingTaskPriority, NursingTaskStatus, AuditAction, AuditOutcome, IncidentType, IncidentSeverity, IncidentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const TENANT_ID = "722d38c5-4e7e-48cd-ba3f-59623ff10d94";
const ORG_ID = "c703a694-dc07-4f73-b4a1-925ff2ca3fdb";
const FACILITY_ID = "a0f8b1c4-1d2e-3f4a-5b6c-7d8e9f0a1b2c";

const DOCTOR_USER_ID = "88888888-8888-8888-8888-888888888888";
const DOCTOR_ID = "11111111-1111-1111-1111-111111111111";

const NURSE_USER_ID = "99999999-9999-9999-9999-999999999999";
const NURSE_ID = "22222222-2222-2222-2222-222222222222";

const PATIENT_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PATIENT_ID = "33333333-3333-3333-3333-333333333333";

const ADMIN_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const SUPERADMIN_USER_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clean existing database records (in reverse dependency order)
  console.log("🧹 Cleaning old records...");
  await prisma.incidentReport.deleteMany({});
  await prisma.nursingTask.deleteMany({});
  await prisma.nursingHandoff.deleteMany({});
  await prisma.medicationAdministration.deleteMany({});
  await prisma.vital.deleteMany({});
  await prisma.diagnosis.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.labResult.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.encounter.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.consentEvent.deleteMany({});
  await prisma.consent.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  // Disconnect and clean bed/ward structures
  await prisma.bed.updateMany({ data: { currentAdmissionId: null } });
  await prisma.admission.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.ward.deleteMany({});

  await prisma.patientProfile.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.nurse.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.userRoleAssignment.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.medication.deleteMany({});

  console.log("🏢 Creating tenant, organization, and facility...");
  
  // 2. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: TENANT_ID,
      name: "City Hospital",
      slug: "cityhospital",
      type: TenantType.hospital,
      status: TenantStatus.active,
      tier: TenantTier.starter,
      region: "India",
      complianceProfile: ComplianceProfile.dpdp,
      contactEmail: "admin@cityhospital.com",
      contactPhone: "+919999999999",
      storagePrefix: "cityhospital",
      settings: {},
      featureFlags: {},
    },
  });

  // 3. Create Organization
  const org = await prisma.organization.create({
    data: {
      id: ORG_ID,
      tenantId: tenant.id,
      name: "City Health Group",
      type: OrgType.hospital,
      status: "active",
      metadata: {},
    },
  });

  // 4. Create Facility
  const facility = await prisma.facility.create({
    data: {
      id: FACILITY_ID,
      tenantId: tenant.id,
      orgId: org.id,
      name: "Main Block",
      address: {
        street: "123 Health Ave",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        zip: "560001",
      },
      phone: "+918022222222",
      isActive: true,
      metadata: {},
    },
  });

  // 5. Create Departments
  console.log("🏥 Creating departments...");
  const genMedDept = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      facilityId: facility.id,
      name: "General Medicine",
      code: "GENMED",
      type: DepartmentType.clinical,
      isActive: true,
    },
  });

  const cardioDept = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      facilityId: facility.id,
      name: "Cardiology",
      code: "CARD",
      type: DepartmentType.clinical,
      isActive: true,
    },
  });

  // 6. Create Roles
  console.log("🔑 Creating roles...");
  const doctorRole = await prisma.role.create({
    data: { name: "doctor", displayName: "Doctor", isSystem: true },
  });
  const nurseRole = await prisma.role.create({
    data: { name: "nurse", displayName: "Nurse", isSystem: true },
  });
  const patientRole = await prisma.role.create({
    data: { name: "patient", displayName: "Patient", isSystem: true },
  });
  const adminRole = await prisma.role.create({
    data: { name: "admin", displayName: "Administrator", isSystem: true },
  });
  const superAdminRole = await prisma.role.create({
    data: { name: "super_admin", displayName: "Super Admin", isSystem: true },
  });

  // 7. Create Users & Profiles
  console.log("👤 Creating users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // -- Doctor User --
  const doctorUser = await prisma.user.create({
    data: {
      id: DOCTOR_USER_ID,
      tenantId: tenant.id,
      email: "doctor@mediflow.com",
      passwordHash,
      status: UserStatus.active,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: doctorUser.id,
      roleId: doctorRole.id,
      isPrimary: true,
    },
  });
  const doctor = await prisma.doctor.create({
    data: {
      id: DOCTOR_ID,
      tenantId: tenant.id,
      userId: doctorUser.id,
      registrationNumber: "KMC-12345",
      registrationBody: "Karnataka Medical Council",
      specialization: "General Medicine",
      departmentId: genMedDept.id,
      qualification: ["MBBS", "MD"],
      yearsOfExperience: 10,
    },
  });

  // -- Nurse User --
  const nurseUser = await prisma.user.create({
    data: {
      id: NURSE_USER_ID,
      tenantId: tenant.id,
      email: "nurse@mediflow.com",
      passwordHash,
      status: UserStatus.active,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: nurseUser.id,
      roleId: nurseRole.id,
      isPrimary: true,
    },
  });
  const nurse = await prisma.nurse.create({
    data: {
      id: NURSE_ID,
      tenantId: tenant.id,
      userId: nurseUser.id,
      registrationNumber: "KNC-98765",
      departmentId: genMedDept.id,
      qualification: ["B.Sc Nursing"],
      shiftType: ShiftType.day,
    },
  });

  // -- Admin User --
  const adminUser = await prisma.user.create({
    data: {
      id: ADMIN_USER_ID,
      tenantId: tenant.id,
      email: "admin@mediflow.com",
      passwordHash,
      status: UserStatus.active,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: adminRole.id,
      isPrimary: true,
    },
  });

  // -- Super Admin User --
  const superAdminUser = await prisma.user.create({
    data: {
      id: SUPERADMIN_USER_ID,
      tenantId: tenant.id,
      email: "superadmin@mediflow.com",
      passwordHash,
      status: UserStatus.active,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      isPrimary: true,
    },
  });

  // -- Patient User --
  const patientUser = await prisma.user.create({
    data: {
      id: PATIENT_USER_ID,
      tenantId: tenant.id,
      email: "patient@mediflow.com",
      passwordHash,
      status: UserStatus.active,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: patientUser.id,
      roleId: patientRole.id,
      isPrimary: true,
    },
  });
  const patient = await prisma.patient.create({
    data: {
      id: PATIENT_ID,
      tenantId: tenant.id,
      userId: patientUser.id,
      uhid: "UHID-20260001",
      abhaId: "12-3456-7890-12",
      status: "active",
      registrationType: RegistrationType.self,
    },
  });
  await prisma.patientProfile.create({
    data: {
      patientId: patient.id,
      tenantId: tenant.id,
      fullName: "Steve Rogers",
      dateOfBirth: new Date("1985-07-04"),
      gender: Gender.male,
      bloodGroup: BloodGroup.O_positive,
      mobileNumber: "+919876543210",
      email: "patient@mediflow.com",
      address: {
        street: "71st Street",
        city: "Brooklyn",
        state: "New York",
        country: "USA",
      },
    },
  });

  // 8. Create Wards, Rooms, and Beds
  console.log("🛌 Seeding ward, room and bed layouts...");
  const wardA = await prisma.ward.create({
    data: {
      tenantId: tenant.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      name: "General Ward A",
      code: "GWA",
      type: WardType.general,
      capacity: 10,
    },
  });

  const wardICU = await prisma.ward.create({
    data: {
      tenantId: tenant.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      name: "ICU Ward B",
      code: "ICUB",
      type: WardType.icu,
      capacity: 5,
    },
  });

  const room101 = await prisma.room.create({
    data: {
      tenantId: tenant.id,
      wardId: wardA.id,
      roomNumber: "Room 101",
      roomType: RoomType.semi_private,
      capacity: 2,
    },
  });

  const room102 = await prisma.room.create({
    data: {
      tenantId: tenant.id,
      wardId: wardA.id,
      roomNumber: "Room 102",
      roomType: RoomType.general,
      capacity: 4,
    },
  });

  const room201 = await prisma.room.create({
    data: {
      tenantId: tenant.id,
      wardId: wardICU.id,
      roomNumber: "Room 201",
      roomType: RoomType.icu,
      capacity: 2,
    },
  });

  const bed101A = await prisma.bed.create({
    data: { tenantId: tenant.id, wardId: wardA.id, roomId: room101.id, bedNumber: "101A", status: BedStatus.available, bedType: BedType.standard },
  });
  const bed101B = await prisma.bed.create({
    data: { tenantId: tenant.id, wardId: wardA.id, roomId: room101.id, bedNumber: "101B", status: BedStatus.available, bedType: BedType.standard },
  });
  
  const bed102A = await prisma.bed.create({
    data: { tenantId: tenant.id, wardId: wardA.id, roomId: room102.id, bedNumber: "102A", status: BedStatus.occupied, bedType: BedType.standard },
  });
  const bed102B = await prisma.bed.create({
    data: { tenantId: tenant.id, wardId: wardA.id, roomId: room102.id, bedNumber: "102B", status: BedStatus.available, bedType: BedType.standard },
  });
  const bed201 = await prisma.bed.create({
    data: { tenantId: tenant.id, wardId: wardICU.id, roomId: room201.id, bedNumber: "201", status: BedStatus.available, bedType: BedType.icu },
  });

  // Assign GWA to Nurse Barton
  await prisma.nurse.update({
    where: { id: nurse.id },
    data: { wardAssignments: [wardA.id] },
  });

  // 9. Seed active Admission for Steve Rogers in Bed 102A
  console.log("🏥 Seeding active patient admission...");
  const admission = await prisma.admission.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admittingDoctorId: doctor.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      wardId: wardA.id,
      bedId: bed102A.id,
      status: "admitted",
      admissionType: "regular",
      admissionDiagnosis: "Acute exacerbation of diabetes & hypertension control",
      admissionNotes: "Admitted for blood glucose monitoring and pharmacological adjustment.",
    },
  });

  // Link bed back to admission
  await prisma.bed.update({
    where: { id: bed102A.id },
    data: { currentAdmissionId: admission.id },
  });

  // 10. Create Medications (Drug Master)
  console.log("💊 Seeding medications...");
  const drugs = [
    { genericName: "Paracetamol", brandNames: ["Crocin", "Calpol", "Dolo"], drugClass: "Analgesic", routesAvailable: ["oral", "intravenous"] },
    { genericName: "Amoxicillin", brandNames: ["Novamox", "Mox"], drugClass: "Antibiotic", routesAvailable: ["oral"] },
    { genericName: "Atorvastatin", brandNames: ["Lipitor", "Atorva"], drugClass: "Statin", routesAvailable: ["oral"] },
    { genericName: "Metformin", brandNames: ["Glycomet", "Glucophage"], drugClass: "Antidiabetic", routesAvailable: ["oral"] },
    { genericName: "Amlodipine", brandNames: ["Amlong", "Norvasc"], drugClass: "Antihypertensive", routesAvailable: ["oral"] },
    { genericName: "Ibuprofen", brandNames: ["Brufen", "Combiflam"], drugClass: "NSAID", routesAvailable: ["oral"] },
    { genericName: "Pantoprazole", brandNames: ["Pan", "Pantocid"], drugClass: "Proton Pump Inhibitor", routesAvailable: ["oral", "intravenous"] },
    { genericName: "Ceftriaxone", brandNames: ["Monotax", "Rocephin"], drugClass: "Cephalosporin Antibiotic", routesAvailable: ["oral", "intravenous"] },
  ];

  const medicationMap: Record<string, string> = {};
  for (const drug of drugs) {
    const med = await prisma.medication.create({
      data: {
        tenantId: tenant.id,
        genericName: drug.genericName,
        brandNames: drug.brandNames,
        drugClass: drug.drugClass,
        routesAvailable: drug.routesAvailable,
        formulary: true,
        isActive: true,
      },
    });
    medicationMap[drug.genericName] = med.id;
  }

  // 11. Create Appointments for Today
  console.log("📅 Seeding appointments...");
  const today = new Date();
  
  const appt1 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      doctorId: doctor.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      appointmentType: AppointmentType.outpatient,
      status: AppointmentStatus.scheduled,
      scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      durationMinutes: 30,
      visitReason: "Regular checkup for hypertension",
      bookingChannel: BookingChannel.walk_in,
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      doctorId: doctor.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      appointmentType: AppointmentType.outpatient,
      status: AppointmentStatus.checked_in,
      scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      durationMinutes: 30,
      visitReason: "Follow up on diabetes",
      bookingChannel: BookingChannel.patient_portal,
    },
  });

  // 12. Seed 1 Encounter linked to Appt2
  console.log("🩺 Seeding encounters...");
  const encounter = await prisma.encounter.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentId: appt2.id,
      facilityId: facility.id,
      departmentId: genMedDept.id,
      encounterType: EncounterType.outpatient,
      status: EncounterStatus.draft,
      chiefComplaint: "Patient complains of mild headache and fatigue for the past 3 days.",
      historyOfPresentIllness: "Symptoms started suddenly. No fever reported.",
      examinationFindings: "BP: 130/85, Pulse: 72 bpm, Temp: 98.4 F.",
      assessmentNotes: "Mild hypertension, stress-induced headache.",
      planNotes: "Advised rest, reduced salt intake, and hydration.",
      createdBy: doctorUser.id,
      startedAt: new Date(),
    },
  });

  // Link Encounter back to Appt2
  await prisma.appointment.update({
    where: { id: appt2.id },
    data: { encounterId: encounter.id },
  });

  // 13. Seed Vitals
  console.log("🫀 Seeding vitals...");
  await prisma.vital.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      recordedBy: doctorUser.id,
      systolicBp: 120.0,
      diastolicBp: 80.0,
      pulse: 72.0,
      temperature: 98.6,
      temperatureUnit: "F",
      spo2: 98.0,
      respiratoryRate: 16.0,
      isCritical: false,
    },
  });

  // 14. Seed Consents
  console.log("🛡️ Seeding consents...");
  await prisma.consent.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      consentingUserId: patientUser.id,
      purpose: "treatment",
      dataScope: ["clinical_records", "vitals"],
      granteeType: "doctor",
      granteeId: doctor.id,
      status: "granted",
      consentTextVersion: "1.0",
    },
  });
  await prisma.consent.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      consentingUserId: patientUser.id,
      purpose: "data_sharing",
      dataScope: ["lab_results"],
      granteeType: "facility",
      granteeId: facility.id,
      status: "granted",
      consentTextVersion: "1.0",
    },
  });

  // 15. Seed Invoices & Payments
  console.log("💳 Seeding invoices & payments...");
  const invoice1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      invoiceNumber: "INV-20260001",
      status: "paid",
      subtotal: 1500.00,
      totalAmount: 1500.00,
      paidAmount: 1500.00,
      createdBy: adminUser.id,
    },
  });
  const payment1 = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: invoice1.id,
      patientId: patient.id,
      amount: 1500.00,
      paymentMethod: "upi",
      paymentStatus: "completed",
      paidAt: new Date(),
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      invoiceNumber: "INV-20260002",
      status: "issued",
      subtotal: 750.00,
      totalAmount: 750.00,
      paidAmount: 0.00,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      createdBy: adminUser.id,
    },
  });

  // 16. Seed Prescriptions & Medication Administration schedules (MAR)
  console.log("📋 Seeding active prescriptions & MAR schedules...");
  const prescription = await prisma.prescription.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      encounterId: encounter.id,
      prescribedBy: doctor.id,
      status: "active",
    },
  });

  const itemParacetamol = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      tenantId: tenant.id,
      medicationId: medicationMap["Paracetamol"],
      dose: 500.00,
      doseUnit: "mg",
      route: "oral",
      frequency: "BD",
      startDate: today,
    },
  });

  const itemMetformin = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      tenantId: tenant.id,
      medicationId: medicationMap["Metformin"],
      dose: 850.00,
      doseUnit: "mg",
      route: "oral",
      frequency: "OD",
      startDate: today,
    },
  });

  const itemCeftriaxone = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      tenantId: tenant.id,
      medicationId: medicationMap["Ceftriaxone"],
      dose: 1.00,
      doseUnit: "g",
      route: "iv",
      frequency: "TDS",
      startDate: today,
    },
  });

  // Seed medication administration records (MAR) scheduled for today
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Paracetamol scheduled at 09:00 AM (already administered)
  await prisma.medicationAdministration.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      prescriptionItemId: itemParacetamol.id,
      administeredBy: nurse.id,
      scheduledTime: new Date(baseDate.getTime() + 9 * 60 * 60 * 1000),
      administeredTime: new Date(baseDate.getTime() + 9 * 15 * 60 * 1000),
      status: MedicationAdminStatus.administered,
      actualDose: 500.00,
      actualRoute: "oral",
      notes: "Administered after breakfast.",
    },
  });

  // Metformin scheduled at 11:00 AM (pending)
  await prisma.medicationAdministration.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      prescriptionItemId: itemMetformin.id,
      administeredBy: nurse.id,
      scheduledTime: new Date(baseDate.getTime() + 11 * 60 * 60 * 1000),
      status: MedicationAdminStatus.pending,
    },
  });

  // Ceftriaxone scheduled at 12:00 PM (pending)
  await prisma.medicationAdministration.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      prescriptionItemId: itemCeftriaxone.id,
      administeredBy: nurse.id,
      scheduledTime: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000),
      status: MedicationAdminStatus.pending,
    },
  });

  // Ceftriaxone scheduled at 07:00 AM (overdue / pending)
  await prisma.medicationAdministration.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      prescriptionItemId: itemCeftriaxone.id,
      administeredBy: nurse.id,
      scheduledTime: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000),
      status: MedicationAdminStatus.pending,
    },
  });

  // 17. Seed Nursing Tasks
  console.log("📝 Seeding nursing tasks...");
  await prisma.nursingTask.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      createdBy: doctorUser.id,
      assignedTo: nurse.id,
      taskType: NursingTaskType.custom,
      title: "Log Patient Vitals",
      description: "Measure and log BP, SpO2, Temperature, and Pulse. Alert doctor if SpO2 drops below 95%.",
      priority: NursingTaskPriority.urgent,
      status: NursingTaskStatus.created,
      dueAt: new Date(baseDate.getTime() + 10 * 60 * 60 * 1000),
    },
  });

  await prisma.nursingTask.create({
    data: {
      tenantId: tenant.id,
      patientId: patient.id,
      admissionId: admission.id,
      createdBy: doctorUser.id,
      assignedTo: nurse.id,
      taskType: NursingTaskType.reposition,
      title: "Reposition patient",
      description: "Prevent pressure ulcers. Reposition from left lateral to supine.",
      priority: NursingTaskPriority.routine,
      status: NursingTaskStatus.completed,
      dueAt: new Date(baseDate.getTime() + 14 * 60 * 60 * 1000),
      completedAt: new Date(baseDate.getTime() + 14 * 5 * 60 * 1000),
      completionNotes: "Patient repositioned successfully. Skin check clear.",
    },
  });

  // 18. Seed Audit Logs using hash chaining
  console.log("🛡️ Seeding secured audit logs...");
  let currentPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  async function seedAuditLog(data: {
    userId: string;
    userRole: string;
    actionType: AuditAction;
    resourceType: string;
    resourceId: string;
    outcome: AuditOutcome;
    timestamp: Date;
    metadata: Record<string, any>;
  }) {
    const timestampStr = data.timestamp.toISOString();
    const metadataStr = JSON.stringify(data.metadata);
    const dataToHash = [
      currentPrevHash,
      data.userId,
      data.userRole,
      data.actionType,
      data.resourceType,
      data.resourceId,
      data.outcome,
      timestampStr,
      metadataStr
    ].join("|");
    const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: data.userId,
        userRole: data.userRole,
        actionType: data.actionType,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: "192.168.1.104",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        outcome: data.outcome,
        prevHash: currentPrevHash,
        hash,
        timestamp: data.timestamp,
        metadata: data.metadata,
      }
    });
    currentPrevHash = hash;
  }

  const baseTime = Date.now();
  await seedAuditLog({
    userId: doctorUser.id,
    userRole: "doctor",
    actionType: AuditAction.USER_LOGIN,
    resourceType: "User",
    resourceId: doctorUser.id,
    outcome: AuditOutcome.success,
    timestamp: new Date(baseTime - 30 * 60 * 1000),
    metadata: { details: "Session started" }
  });

  await seedAuditLog({
    userId: nurseUser.id,
    userRole: "nurse",
    actionType: AuditAction.USER_LOGIN,
    resourceType: "User",
    resourceId: nurseUser.id,
    outcome: AuditOutcome.success,
    timestamp: new Date(baseTime - 25 * 60 * 1000),
    metadata: { details: "Session started" }
  });

  await seedAuditLog({
    userId: nurseUser.id,
    userRole: "nurse",
    actionType: AuditAction.PATIENT_RECORD_ACCESSED,
    resourceType: "Patient",
    resourceId: patient.id,
    outcome: AuditOutcome.success,
    timestamp: new Date(baseTime - 12 * 60 * 1000),
    metadata: { uhid: patient.uhid, reason: "Routine ward round" }
  });

  await seedAuditLog({
    userId: nurseUser.id,
    userRole: "nurse",
    actionType: AuditAction.MEDICATION_ADMINISTERED,
    resourceType: "MedicationAdministration",
    resourceId: itemParacetamol.id,
    outcome: AuditOutcome.success,
    timestamp: new Date(baseTime - 2 * 60 * 1000),
    metadata: { drug: "Paracetamol", dose: "500mg", route: "oral" }
  });

  // 19. Seed Incident Report
  console.log("🚨 Seeding active incident report...");
  await prisma.incidentReport.create({
    data: {
      tenantId: tenant.id,
      reportedBy: nurseUser.id,
      incidentType: IncidentType.clinical_safety,
      severity: IncidentSeverity.medium,
      status: IncidentStatus.investigating,
      title: "Medication Verification Alert - Incompatibility Check",
      description: "A near-miss incident where Ceftriaxone was ordered with Calcium-containing IV fluids. Alerted doctor and modified IV carrier fluid.",
      affectedPatients: [patient.id],
      timeline: [
        { time: new Date(baseTime - 45 * 60 * 1000).toISOString(), event: "Nurse noticed potential Calcium-Ceftriaxone compatibility issue." },
        { time: new Date(baseTime - 35 * 60 * 1000).toISOString(), event: "Doctor contacted, order verified and adjusted to normal saline carrier." }
      ],
      rootCause: "Order template default values lacked contraindication warnings.",
      remediation: "Configured order rule warning in EHR template for Ceftriaxone.",
    }
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
