import { failure } from "@backend/utils/response";
import { file } from "bun";
import { Elysia } from "elysia";

const fallback = new Elysia({ name: "fallback" })
	.all("*", ({ status }) => status(200, file("public/index.html")), {
		detail: { hide: true }
	})
	.all(
		"/api/*",
		({ status }) => status(404, failure({ message: "Resource not found" })),
		{ detail: { hide: true } }
	);

export default fallback;
