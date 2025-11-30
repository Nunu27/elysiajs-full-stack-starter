import { createRouter } from "@backend/plugins/services";

import changePassword from "./change-password";
import login from "./login";
import logout from "./logout";
import me from "./me";

const authRouter = createRouter({
	detail: { tags: ["Authentication"] }
})
	.use(login)
	.use(logout)
	.use(changePassword)
	.use(me);

export default authRouter;
