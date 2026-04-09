CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"plate" text NOT NULL,
	"colour" text,
	"mot_due_date" timestamp with time zone,
	"tax_due_date" timestamp with time zone,
	"next_service_date" timestamp with time zone,
	"mot_reminder_days" integer DEFAULT 30,
	"tax_reminder_days" integer DEFAULT 30,
	"service_reminder_days" integer DEFAULT 14,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"module" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_size_bytes" integer,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "electronics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model_number" text,
	"purchase_date" timestamp with time zone,
	"cost_cents" integer,
	"warranty_expiry_date" timestamp with time zone,
	"coverage_summary" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "electronics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"policy_type" text NOT NULL,
	"insurer" text NOT NULL,
	"policy_number" text,
	"expiry_date" timestamp with time zone NOT NULL,
	"renewal_contact_name" text,
	"renewal_contact_phone" text,
	"renewal_contact_email" text,
	"payment_schedule" text,
	"premium_cents" integer,
	"next_payment_date" timestamp with time zone,
	"expiry_reminder_days" integer DEFAULT 30,
	"payment_reminder_days" integer DEFAULT 7,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "insurance_policies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "service_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"service_date" timestamp with time zone NOT NULL,
	"service_type" text NOT NULL,
	"mileage" integer,
	"garage" text,
	"cost_cents" integer,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "service_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronics" ADD CONSTRAINT "electronics_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "cars_all_member" ON "cars" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "documents_all_member" ON "documents" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "electronics_all_member" ON "electronics" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "insurance_policies_all_member" ON "insurance_policies" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "service_records_all_member" ON "service_records" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));

-- Create private storage bucket for household documents (PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: household members can manage their own household's files
CREATE POLICY "household_members_manage_docs" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text FROM household_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text FROM household_members WHERE user_id = auth.uid()
    )
  );