CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "children" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kid_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"location" text,
	"assignee_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"notes" text,
	"reminder_offset_minutes" integer,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" jsonb,
	"parent_activity_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "kid_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_activities" ADD CONSTRAINT "kid_activities_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_activities" ADD CONSTRAINT "kid_activities_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_user_id_unique" UNIQUE("household_id","user_id");--> statement-breakpoint
CREATE POLICY "children_all_member" ON "children" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "kid_activities_all_member" ON "kid_activities" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));