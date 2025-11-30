import { createRouter } from "@backend/plugins/services";
import { success } from "@backend/utils/response";

export default createRouter().post(
	"/logout",
	async ({ session }) => {
		await session.delete();

		return success({
			message: "Logout successful"
		});
	},
	{
		protected: true,
		detail: {
			description: "Logout and invalidate the current session"
		}
	}
);
