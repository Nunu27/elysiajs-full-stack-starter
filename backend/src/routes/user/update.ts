import { users } from "@backend/db/schema/auth";
import { deleteCache } from "@backend/middlewares/caching";
import { createRouter } from "@backend/plugins/services";
import { RequestWithId } from "@backend/routes/schema";
import { failure } from "@backend/utils/response";
import { eq } from "drizzle-orm";
import { UpdateUserRequest } from "./schema";

export default createRouter().put(
	"/:id",
	async ({ params, body, db, status }) => {
		const { id } = params;

		const { rowCount } = await db
			.update(users)
			.set(body)
			.where(eq(users.id, id));
		if (rowCount === 0) {
			return status(404, failure({ message: "User not found" }));
		}

		await deleteCache("user:pagination:*", `user:${id}`);

		return { message: "User updated" };
	},
	{
		private: ["admin"],
		params: RequestWithId,
		body: UpdateUserRequest,
		detail: {
			description: "Update a user"
		}
	}
);
