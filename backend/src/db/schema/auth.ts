import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { base } from "./base";

// Auth tables example
export const roleEnum = pgEnum("role", ["student", "lecturer", "admin"]);
export type Role = (typeof roleEnum.enumValues)[number];

export const users = pgTable("user", {
	...base,
	name: text().notNull(),
	email: text().notNull().unique(),
	passwordHash: text(),
	role: roleEnum().notNull().default("student")
});
