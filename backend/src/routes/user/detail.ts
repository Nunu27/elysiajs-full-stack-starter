import { createRouter } from "@backend/plugins/services";
import { RequestWithId } from "@backend/routes/schema";
import { failure, success } from "@backend/utils/response";

export default createRouter().guard(
	{
		cached: true,
		private: ["admin"],
		params: RequestWithId,
		detail: {
			description: "Get user detail"
		}
	},
	(app) =>
		app
			.resolve(({ params }) => ({
				cacheKey: `user:${params.id}`
			}))
			.get("/:id", async ({ params, db, status }) => {
				const { id } = params;

				const user = await db.query.users.findFirst({
					columns: {
						passwordHash: false
					},
					where: (users, { eq }) => eq(users.id, id)
				});
				if (!user) {
					return status(404, failure({ message: "User not found" }));
				}

				return success({
					data: user
				});
			})
);
