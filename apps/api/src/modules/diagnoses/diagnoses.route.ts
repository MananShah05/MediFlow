import { FastifyInstance } from "fastify";
import { z } from "zod";

// ICD-10 codes stored as a static reference table (seeded)
// We also support search from an in-memory list for speed
const ICD10_CODES = [
  { code: "I10", description: "Essential (primary) hypertension" },
  { code: "I11.9", description: "Hypertensive heart disease without heart failure" },
  { code: "I25.10", description: "Atherosclerotic heart disease of native coronary artery" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia" },
  { code: "E78.5", description: "Hyperlipidemia, unspecified" },
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
  { code: "J18.9", description: "Pneumonia, unspecified organism" },
  { code: "J44.1", description: "Chronic obstructive pulmonary disease with acute exacerbation" },
  { code: "J45.909", description: "Unspecified asthma, uncomplicated" },
  { code: "K21.0", description: "Gastro-esophageal reflux disease with esophagitis" },
  { code: "K29.70", description: "Gastritis, unspecified, without bleeding" },
  { code: "K59.00", description: "Constipation, unspecified" },
  { code: "M54.5", description: "Low back pain" },
  { code: "M79.3", description: "Panniculitis, unspecified" },
  { code: "M25.50", description: "Pain in unspecified joint" },
  { code: "G43.909", description: "Migraine, unspecified, not intractable" },
  { code: "G47.00", description: "Insomnia, unspecified" },
  { code: "F41.1", description: "Generalized anxiety disorder" },
  { code: "F32.9", description: "Major depressive disorder, single episode, unspecified" },
  { code: "F41.9", description: "Anxiety disorder, unspecified" },
  { code: "N39.0", description: "Urinary tract infection, site not specified" },
  { code: "N18.9", description: "Chronic kidney disease, unspecified" },
  { code: "R10.9", description: "Unspecified abdominal pain" },
  { code: "R50.9", description: "Fever, unspecified" },
  { code: "R51", description: "Headache" },
  { code: "R05", description: "Cough" },
  { code: "R06.02", description: "Shortness of breath" },
  { code: "R42", description: "Dizziness and giddiness" },
  { code: "R11.0", description: "Nausea" },
  { code: "R11.10", description: "Vomiting, unspecified" },
  { code: "R53.83", description: "Other fatigue" },
  { code: "R63.0", description: "Anorexia" },
  { code: "L30.9", description: "Dermatitis, unspecified" },
  { code: "L50.9", description: "Urticaria, unspecified" },
  { code: "B34.9", description: "Viral infection, unspecified" },
  { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "D64.9", description: "Anemia, unspecified" },
  { code: "D50.9", description: "Iron deficiency anemia, unspecified" },
  { code: "Z00.00", description: "Encounter for general adult medical examination" },
  { code: "Z23", description: "Encounter for immunization" },
  { code: "Z12.31", description: "Encounter for screening mammogram for malignant neoplasm of breast" },
  { code: "J02.9", description: "Acute pharyngitis, unspecified" },
  { code: "J01.90", description: "Acute sinusitis, unspecified" },
  { code: "H66.90", description: "Otitis media, unspecified, unspecified ear" },
  { code: "H10.9", description: "Conjunctivitis, unspecified" },
  { code: "K30", description: "Functional dyspepsia" },
  { code: "K76.0", description: "Fatty (change of) liver, not elsewhere classified" },
  { code: "E03.9", description: "Hypothyroidism, unspecified" },
  { code: "E05.90", description: "Thyrotoxicosis, unspecified without thyrotoxic crisis" },
  { code: "M10.9", description: "Gout, unspecified" },
  { code: "M81.0", description: "Age-related osteoporosis without current pathological fracture" },
  { code: "S82.001A", description: "Unspecified fracture of right patella, initial encounter" },
  { code: "S62.001A", description: "Unspecified fracture of navicular [scaphoid] bone of right wrist" },
  { code: "T78.40XA", description: "Allergy, unspecified, initial encounter" },
  { code: "R73.09", description: "Other abnormal glucose" },
  { code: "E55.9", description: "Vitamin D deficiency, unspecified" },
  { code: "E56.1", description: "Vitamin B12 deficiency" },
  { code: "J20.9", description: "Acute bronchitis, unspecified" },
  { code: "N40.0", description: "Benign prostatic hyperplasia without lower urinary tract symptoms" },
];

export async function diagnosisRoutes(fastify: FastifyInstance) {
  // GET /api/v1/icd-codes — Search ICD-10 codes
  fastify.get("/icd-codes", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const { search, limit } = z.object({
      search: z.string().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(15),
    }).parse(request.query);

    if (!search) {
      return { data: ICD10_CODES.slice(0, limit) };
    }

    const searchLower = search.toLowerCase();
    const results = ICD10_CODES.filter(
      (icd) =>
        icd.code.toLowerCase().includes(searchLower) ||
        icd.description.toLowerCase().includes(searchLower)
    ).slice(0, limit);

    return { data: results };
  });
}
