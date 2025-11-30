import db from "@backend/db";
import { fileDependencies, files } from "@backend/db/schema/file";
import env from "@backend/env";
import { and, eq, inArray } from "drizzle-orm";
import path from "path";
import { S3mini } from "s3mini";
import logger from "./logger";

const storage = new S3mini({
	accessKeyId: env.S3_ACCESS_KEY,
	secretAccessKey: env.S3_SECRET_KEY,
	endpoint: env.S3_ENDPOINT,
	requestAbortTimeout: 5000
});

export default storage;

function getUniqueFilename(name: string, buffer: Buffer) {
	const length = 8;

	const hash = new Bun.CryptoHasher("sha256").update(buffer).digest();
	const base64url = hash
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
	const shortHash = base64url.slice(0, length);
	const ext = path.extname(name);

	return `${shortHash}${ext}`;
}

export async function uploadFile(file: File, from: string) {
	const fileBuffer = Buffer.from(await file.arrayBuffer());
	const name = getUniqueFilename(file.name, fileBuffer);

	const id = await db.transaction(async (tx) => {
		const [insertedFile] = await tx
			.insert(files)
			.values({
				name
			})
			.onConflictDoUpdate({ target: files.name, set: { unused: false } })
			.returning({ id: files.id });

		await tx
			.insert(fileDependencies)
			.values({
				file: name,
				name: from
			})
			.onConflictDoNothing();

		const res = await storage.putObject(name, fileBuffer, file.type);
		if (!res.ok) throw new Error(`Failed to upload file`);

		return insertedFile.id;
	});

	return { id, name };
}

export async function deleteFile(name: string, from: string) {
	return await db.transaction(async (tx) => {
		const { rowCount } = await tx
			.delete(fileDependencies)
			.where(
				and(eq(fileDependencies.file, name), eq(fileDependencies.name, from))
			);
		if (!rowCount) return rowCount;

		const count = await tx.$count(
			fileDependencies,
			eq(fileDependencies.file, name)
		);

		if (!count) {
			await tx.update(files).set({ unused: true }).where(eq(files.name, name));
		}

		return rowCount;
	});
}

export async function storageCleanup() {
	await db.transaction(async (tx) => {
		const fileToDelete = await tx.query.files.findMany({
			columns: { name: true },
			where(fields, operators) {
				return operators.eq(fields.unused, true);
			}
		});

		const names = fileToDelete.map((file) => file.name);
		if (!names.length) {
			return;
		}

		logger.info("Found %d unused files, deleting...", names.length);

		await tx.delete(files).where(inArray(files.name, names));
		const statuses = await storage.deleteObjects(names);
		const failed = names.filter((_, index) => !statuses[index]);

		if (failed.length) {
			await tx
				.insert(files)
				.values(failed.map((name) => ({ name, unused: true })));
		}

		logger.info("Deleted %d unused files", names.length - failed.length);
	});
}
