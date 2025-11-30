import "dotenv/config";

import { Static, Type as t } from "typebox";
import { Compile } from "typebox/compile";

const EnvSchema = t.Object({
	// System
	NODE_ENV: t.Union([
		t.Literal("development"),
		t.Literal("production"),
		t.Literal("test")
	]),

	PORT: t.Number({ default: 3000 }),

	DATABASE_URL: t.String({ format: "uri" }),
	REDIS_URL: t.String({ format: "uri" }),

	SESSION_TTL: t.Number({ default: 60 * 60 * 3 }),
	BATCH_SIZE: t.Number({ default: 100 }),
	DEBOUNCE_MS: t.Number({ default: 100 }),
	MAX_BATCH_WAIT_MS: t.Number({ default: 500 }),

	S3_ENDPOINT: t.String({ format: "uri" }),
	S3_ACCESS_KEY: t.String(),
	S3_SECRET_KEY: t.String(),

	// Auth
	BASE_URL: t.String({ format: "uri" }),
	COOKIE_SECRET: t.String({ minLength: 32, maxLength: 64 })
});

const validator = Compile(EnvSchema);

const errors = validator.Errors(
	validator.Convert(validator.Default(process.env))
);
if (errors.length > 0) {
	console.error("❌ Invalid environment variables:");
	for (const error of errors) {
		console.error(`- ${error.instancePath} ${error.message}`);
	}
	process.exit(1);
}

const env = validator.Parse(process.env);

export default env;
export type Env = Static<typeof EnvSchema>;
export const inProduction = env.NODE_ENV === "production";
