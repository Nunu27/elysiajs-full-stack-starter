import { timestamp, uuid } from "drizzle-orm/pg-core";

export const base = {
	id: uuid()
		.primaryKey()
		.$default(() => Bun.randomUUIDv7()),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date())
};
