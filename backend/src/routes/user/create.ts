import { users } from "@backend/db/schema/auth";
import { deleteCache } from "@backend/middlewares/caching";
import { createRouter } from "@backend/plugins/services";
import { success } from "@backend/utils/response";
import { CreateUserRequest } from "./schema";

export default createRouter().post(
	"/",
	async ({ body, db }) => {
		const [user] = await db
			.insert(users)
			.values({
				...body,
				passwordHash: await Bun.password.hash(body.password)
			})
			.returning({ id: users.id });
		await deleteCache("user:pagination:*");

		return success({ message: "User created", data: { id: user.id } });
	},
	{
		private: ["admin"],
		body: CreateUserRequest,
		detail: {
			description: "Create a new user"
		}
	}
);
