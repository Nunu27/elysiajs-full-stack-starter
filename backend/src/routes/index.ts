import { name, version } from "@backend/../package.json";
import { success } from "@backend/utils/response";
import { Elysia } from "elysia";

import authRouter from "./auth";
import fileRouter from "./file";
import userRouter from "./user";

export default new Elysia({ prefix: "/api" })
	.get("/", () => success({ data: { name, version } }))

	.group("/auth", (app) => app.use(authRouter))
	.group("/file", (app) => app.use(fileRouter))
	.group("/user", (app) => app.use(userRouter));
