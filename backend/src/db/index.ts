import env from "@backend/env";
import logger from "@backend/services/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { isProduction } from "elysia/error";
import * as schema from "./schema";

const db = drizzle({
	schema,
	casing: "snake_case",
	logger: !isProduction,
	connection: env.DATABASE_URL
});

export default db;
export async function checkAndRunMigration() {
	try {
		await migrate(db, {
			migrationsFolder: "./migrations"
		});
	} catch (error) {
		logger.error({ error }, "Migration failed");
		throw error;
	}
}
