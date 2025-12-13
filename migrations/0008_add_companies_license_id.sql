-- Add license_id column to companies and create FK to licenses(id)
-- Safe to run multiple times: check existence before create where supported

-- 1) Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'license_id'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "license_id" integer;
  END IF;
END$$;

-- 2) Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'companies'
      AND constraint_name = 'companies_license_id_licenses_id_fk'
  ) THEN
    ALTER TABLE "companies"
      ADD CONSTRAINT "companies_license_id_licenses_id_fk"
      FOREIGN KEY ("license_id") REFERENCES "licenses"("id")
      ON UPDATE NO ACTION ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Optional index to speed up joins
CREATE INDEX IF NOT EXISTS "idx_companies_license_id" ON "companies"("license_id");


