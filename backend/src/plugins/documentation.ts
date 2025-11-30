import { name, version } from "@backend/../package.json";
import { inProduction } from "@backend/env";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";

const documentation = new Elysia({ name: "documentation" }).use(
	openapi({
		enabled: !inProduction,
		scalar: {
			showToolbar: "never"
		},
		documentation: {
			info: { title: name, version }
		}
	})
);

export default documentation;
