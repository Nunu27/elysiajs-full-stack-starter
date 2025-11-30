import { createWSEvent } from "@backend/plugins/ws";
import { UserDeleteRequest } from "./schema";

export default createWSEvent({
	type: "server2client",
	name: "user/update",
	private: ["admin"],
	body: UserDeleteRequest
});
