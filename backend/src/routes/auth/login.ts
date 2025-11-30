import { createRouter } from "@backend/plugins/services";
import { failure, success } from "@backend/utils/response";
import { LoginRequest } from "./schema";

export default createRouter().post(
	"/login",
	async ({ body, status, session: { set }, db }) => {
		const user = await db.query.users.findFirst({
			where: (user, { eq }) => eq(user.email, body.email),
			columns: { passwordHash: true, id: true, role: true }
		});

		if (!user) {
			return status(404, failure({ message: "User not found" }));
		} else if (!user.passwordHash) {
			return status(401, failure({ message: "Please login using OAuth" }));
		} else if (await Bun.password.verify(body.password, user.passwordHash)) {
			const session = {
				id: user.id,
				role: user.role
			};
			await set(session);
			return success({ message: "Login successful" });
		} else {
			return status(401, failure({ message: "Invalid password" }));
		}
	},
	{
		guest: true,
		body: LoginRequest,
		detail: {
			description: "Login with email and password"
		}
	}
);
