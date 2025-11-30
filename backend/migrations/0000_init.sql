CREATE TYPE "public"."role" AS ENUM('student', 'lecturer', 'admin');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"role" "role" DEFAULT 'student' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "file_dependency" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" text NOT NULL,
	"file" text NOT NULL,
	CONSTRAINT "file_dependency_file_name_unique" UNIQUE("file","name")
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" text NOT NULL,
	"unused" boolean DEFAULT true NOT NULL,
	CONSTRAINT "file_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "file_dependency" ADD CONSTRAINT "file_dependency_file_file_name_fk" FOREIGN KEY ("file") REFERENCES "public"."file"("name") ON DELETE cascade ON UPDATE no action;