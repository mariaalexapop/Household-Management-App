CREATE TABLE "activity_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_feed" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "household_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"claimed_by" uuid,
	CONSTRAINT "household_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "household_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "household_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "household_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"household_type" text NOT NULL,
	"active_modules" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "household_settings_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
ALTER TABLE "household_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_settings" ADD CONSTRAINT "household_settings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "activity_feed_select_member" ON "activity_feed" AS PERMISSIVE FOR SELECT TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "activity_feed_insert_member" ON "activity_feed" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_invites_select_member" ON "household_invites" AS PERMISSIVE FOR SELECT TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_invites_insert_member" ON "household_invites" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_members_select_own_household" ON "household_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_members_insert_self" ON "household_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "household_members_delete_admin_only" ON "household_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = (select auth.uid()) AND role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "household_settings_select_member" ON "household_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_settings_insert_member" ON "household_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "household_settings_update_member" ON "household_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "households_select_member" ON "households" AS PERMISSIVE FOR SELECT TO "authenticated" USING (id IN (
        SELECT household_id FROM household_members WHERE user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "households_insert_authenticated" ON "households" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);

-- Add auth.users ON DELETE CASCADE constraints (Drizzle cannot cross-schema FK)
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_invited_by_fk"
  FOREIGN KEY ("invited_by") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_claimed_by_fk"
  FOREIGN KEY ("claimed_by") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add tables to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE household_members;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;