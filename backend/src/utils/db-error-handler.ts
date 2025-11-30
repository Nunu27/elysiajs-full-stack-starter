import { status } from "elysia";
import { DatabaseError } from "pg";
import { failure } from "./response";

const toTitleCase = (str: string) => {
	return str
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

function handleForeignKeyViolation(error: DatabaseError) {
	if (
		error.detail?.includes("still referenced") ||
		error.detail?.includes("is referenced")
	) {
		const table = error.table ? toTitleCase(error.table) : null;

		return status(
			409,
			failure({
				message: `Cannot delete the data because it is still referenced by ${table ?? "other"} data.`
			})
		);
	} else if (error.detail?.includes("not present")) {
		const [, table] = error.detail.split('"');

		return status(
			422,
			failure({
				message: `The referenced ${toTitleCase(table)} does not exist.`
			})
		);
	}

	return status(
		400,
		failure({
			message: "Foreign key violation error."
		})
	);
}

function handleUniqueViolation(error: DatabaseError) {
	console.error(error);
	if (error.detail?.startsWith("Key (")) {
		const table = error.table ? toTitleCase(error.table) : "data";
		const column = error.detail.substring(5, error.detail.indexOf(")="));

		return status(
			400,
			failure({
				message: `The ${toTitleCase(column)} is already used by other ${table}.`
			})
		);
	}

	return status(
		400,
		failure({
			message: "Foreign key violation error."
		})
	);
}

export default {
	"23001": handleForeignKeyViolation,
	"23503": handleForeignKeyViolation,
	"23505": handleUniqueViolation
} as const;
