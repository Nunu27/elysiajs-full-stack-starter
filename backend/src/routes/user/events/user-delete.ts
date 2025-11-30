import { users } from "@backend/db/schema";
import { createWSEvent } from "@backend/plugins/ws";
import { eq } from "drizzle-orm";
import { UserDeleteRequest } from "./schema";

export default createWSEvent({
	type: "client2server",
	name: "user/delete",
	private: ["admin"],
	body: UserDeleteRequest,
	handler: async ({ ws, body: id }) => {
		await ws.data.db.delete(users).where(eq(users.id, id));
	}
});
