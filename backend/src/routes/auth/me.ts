import { createRouter } from "@backend/plugins/services";
import { failure, success } from "@backend/utils/response";

export default createRouter().get(
	"/me",
	async ({ session, db, status }) => {
		const user = await db.query.users.findFirst({
			where: (user, { eq }) => eq(user.id, session.id),
			columns: { passwordHash: false },
			with: {
				lecturer: {
					columns: { nip: true }
				},
				student: {
					columns: { nrp: true, degreeLevel: true, year: true },
					with: {
						studyProgram: {
							columns: { id: true, name: true }
						}
					}
				}
			}
		});

		if (!user) return status(404, failure({ message: "User not found" }));
		const { lecturer, student, ...rest } = user;

		return success({
			data: {
				...rest,
				...lecturer,
				...student
			}
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
