import { inProduction } from "@backend/env";
import logger from "@backend/services/logger";
import dbErrorHandler from "@backend/utils/db-error-handler";
import { formatError } from "@backend/utils/error-formatter";
import { failure } from "@backend/utils/response";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import { Elysia, type ValidationError } from "elysia";
import { DatabaseError } from "pg";

const errorHandler = new Elysia({ name: "error-handler" })
	.error({
		DrizzleQueryError,
		DrizzleError
	})
	.onError(({ code, error, status, path }) => {
		switch (code) {
			case "VALIDATION":
				return status(
					422,
					failure({
						message: "Validation error",
						errors: error.all.flatMap((e) =>
							formatError(e as ValidationError["valueError"])
						)
					})
				);

			case "DrizzleError":
				logger.error({ error: error.cause }, error.message);

				return status(
					500,
					failure({
						message: inProduction ? "Internal server error" : error.message
					})
				);

			case "DrizzleQueryError":
				if (
					error.cause instanceof DatabaseError &&
					error.cause.code &&
					error.cause.code in dbErrorHandler
				) {
					const key = error.cause.code as keyof typeof dbErrorHandler;
					return dbErrorHandler[key](error.cause);
				}

				logger.error({ error: error.cause }, error.message);

				return status(
					500,
					failure({
						message: inProduction ? "Internal server error" : error.message
					})
				);

			default:
				console.error(error);

				return status(
					500,
					failure({
						message: inProduction ? "Internal server error" : error.toString()
					})
				);
		}
	})
	.as("global");

export default errorHandler;
