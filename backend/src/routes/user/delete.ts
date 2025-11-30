import { users } from "@backend/db/schema/auth";
import { deleteCache } from "@backend/middlewares/caching";
import { createRouter } from "@backend/plugins/services";
import { RequestWithId } from "@backend/routes/schema";
import { failure, success } from "@backend/utils/response";
import { eq } from "drizzle-orm";

export default createRouter().delete(
	"/:id",
	async ({ params, db, status }) => {
		const { id } = params;

		const { rowCount } = await db.delete(users).where(eq(users.id, id));
		if (!rowCount) {
			return status(404, failure({ message: "User not found" }));
		}

		await deleteCache("user:pagination:*", `user:${id}`);

		return success({ message: "User deleted" });
	},
	{
		private: ["admin"],
		params: RequestWithId,
		detail: {
			description: "Delete a user"
		}
	}
);
