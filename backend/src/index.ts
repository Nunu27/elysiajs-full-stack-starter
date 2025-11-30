import logger from "@backend/services/logger";
import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";

const command = process.argv[2];

if (command === "seed") {
	logger.info("🌱 Running database seeding...");
	try {
		await import("@backend/seeder");
	} catch (error) {
		logger.error({ error }, "Seeding failed");
		process.exit(1);
	}
} else if (command && !command.endsWith("server")) {
	logger.error(`Unknown command: ${command}`);
	logger.info("Available commands: seed");
	process.exit(1);
}

import { inProduction } from "./env";
import { startServer } from "./services/server";

await startServer();

if (cluster.isPrimary && inProduction) {
	for (let i = 1; i < os.availableParallelism(); i++) cluster.fork();
}
