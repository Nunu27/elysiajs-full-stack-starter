import { users } from "@backend/db/schema/auth";
import { createRouter } from "@backend/plugins/services";
import { failure, success } from "@backend/utils/response";
import { eq } from "drizzle-orm";
import { ChangePasswordRequest } from "./schema";

export default createRouter().post(
	"/change-password",
	async ({ session, body, status, db, redis }) => {
		const user = await db.query.users.findFirst({
			where: (user, { eq }) => eq(user.id, session.id),
			columns: { passwordHash: true }
		});

		if (!user) return status(404, failure({ message: "User not found" }));
		if (
			!user.passwordHash ||
			(await Bun.password.verify(body.oldPassword, user.passwordHash))
		) {
			if (body.newPassword !== body.confirmPassword) {
				return status(400, failure({ message: "Passwords do not match" }));
			}

			user.passwordHash = await Bun.password.hash(body.newPassword);
			await db
				.update(users)
				.set({ passwordHash: user.passwordHash })
				.where(eq(users.id, session.id));
			await redis.del(session.id);
			return success({ message: "Password changed successfully" });
		} else {
			return status(400, failure({ message: "Old password is incorrect" }));
		}
	},
	{
		protected: true,
		body: ChangePasswordRequest,
		detail: {
			description: "Change password for logged in user"
		}
	}
);
