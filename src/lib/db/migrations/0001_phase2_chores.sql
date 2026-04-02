CREATE TABLE "chore_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chore_areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"entity_id" uuid,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"area_id" uuid,
	"owner_id" uuid,
	"status" text DEFAULT 'todo' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" jsonb,
	"parent_task_id" uuid,
	"created_by" uuid NOT NULL,
	"reminder_offset_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chore_areas" ADD CONSTRAINT "chore_areas_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_area_id_chore_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."chore_areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "chore_areas_all_member" ON "chore_areas" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_insert_member" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "tasks_all_member" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      )) WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint

-- Manual FK: tasks.created_by → auth.users(id)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_auth_users_fk"
  FOREIGN KEY ("created_by") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint

-- Manual FK: tasks.parent_task_id → tasks(id)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fk"
  FOREIGN KEY ("parent_task_id") REFERENCES tasks(id) ON DELETE SET NULL;--> statement-breakpoint

-- Manual FK: tasks.owner_id → household_members(id)
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES household_members(id) ON DELETE SET NULL;--> statement-breakpoint

-- Manual FK: notifications.user_id → auth.users(id)
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_auth_users_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;