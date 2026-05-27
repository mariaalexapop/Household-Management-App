CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"source_module" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_field" text NOT NULL,
	"deadline_date" date NOT NULL,
	"suggested_title" text NOT NULL,
	"suggested_notes" text,
	"suggested_owner_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_task_id" text,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "suggestions_unique_deadline" UNIQUE("household_id","source_module","source_entity_id","source_field","deadline_date")
);
--> statement-breakpoint
ALTER TABLE "suggestions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "insurance_policies" ALTER COLUMN "expiry_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "mot_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "mot_payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "tax_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "tax_payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD COLUMN "covered_name" text;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD COLUMN "linked_car_id" uuid;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "expiry_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suggestions_household_status_idx" ON "suggestions" USING btree ("household_id","status");--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_linked_car_id_cars_id_fk" FOREIGN KEY ("linked_car_id") REFERENCES "public"."cars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "suggestions_all_member" ON "suggestions" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));