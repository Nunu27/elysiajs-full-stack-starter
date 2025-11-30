import { users } from "@backend/db/schema/auth";
import logger from "@backend/services/logger";
import { Transaction } from "@backend/types/seeder";

export default {
	seed: async (tx: Transaction) => {
		logger.info("Seeding admin user...");

		const { rowCount } = await tx
			.insert(users)
			.values({
				name: "Admin",
				email: "admin@vlab.pens.ac.id",
				passwordHash: await Bun.password.hash("admin123"),
				role: "admin"
			})
			.onConflictDoNothing();

		logger.info(`Seeded ${rowCount} admin user(s)`);
	}
};
