import db from "@backend/db";
import logger from "@backend/services/logger";

import admin from "./admin";

try {
	logger.info("Seeding...");
	await db.transaction(async (tx) => {
		await admin.seed(tx);
	});
} catch (error) {
} finally {
	logger.info("Seeding complete");
	process.exit(0);
}
