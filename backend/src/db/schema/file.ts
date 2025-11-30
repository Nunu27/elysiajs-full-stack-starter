import { boolean, pgTable, text, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { base } from "./base";

export const files = pgTable("file", {
	...base,
	name: text().unique().notNull(),
	unused: boolean().notNull().default(true)
});

export const fileRelations = relations(files, ({ many }) => ({
	dependencies: many(fileDependencies)
}));

export const fileDependencies = pgTable(
	"file_dependency",
	{
		...base,
		name: text().notNull(),
		file: text()
			.references(() => files.name, { onDelete: "cascade" })
			.notNull()
	},
	(t) => [unique().on(t.file, t.name)]
);

export const fileDependenciesRelations = relations(
	fileDependencies,
	({ one }) => ({
		file: one(files, {
			fields: [fileDependencies.file],
			references: [files.name]
		})
	})
);
