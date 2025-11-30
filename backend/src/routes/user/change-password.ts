import { users } from "@backend/db/schema/auth";
import { createRouter } from "@backend/plugins/services";
import { failure, success } from "@backend/utils/response";
import { eq } from "drizzle-orm";
import { ChangePasswordRequest } from "./schema";
import { RequestWithId } from "../schema";

export default createRouter().post(
	"/:id/change-password",
	async ({ params, body, status, db }) => {
		const { id } = params;
		const user = await db.query.users.findFirst({
			where: (user, { eq }) => eq(user.id, id),
			columns: { passwordHash: true }
		});

		if (!user) return status(404, failure({ message: "User not found" }));

		if (body.newPassword !== body.confirmPassword) {
			return status(400, failure({ message: "Passwords do not match" }));
		}

		user.passwordHash = await Bun.password.hash(body.newPassword);
		await db
			.update(users)
			.set({ passwordHash: user.passwordHash })
			.where(eq(users.id, id));
		return success({ message: "Password changed successfully" });
	},
	{
		private: ["admin"],
		params: RequestWithId,
		body: ChangePasswordRequest,
		detail: {
			description: "Change password for a user"
		}
	}
);
