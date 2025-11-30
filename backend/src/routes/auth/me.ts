import { createRouter } from "@backend/plugins/services";
import { failure, success } from "@backend/utils/response";

export default createRouter().get(
	"/me",
	async ({ session, db, status }) => {
		const user = await db.query.users.findFirst({
			where: (user, { eq }) => eq(user.id, session.data.id),
			columns: { passwordHash: false }
		});

		if (!user) return status(404, failure({ message: "User not found" }));

		return success({
			data: user
		});
	},
	{
		protected: true,
		cached: {
			key: "me",
			personalized: true
		},
		detail: { description: "Get current logged in user" }
	}
);
