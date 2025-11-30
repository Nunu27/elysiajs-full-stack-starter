import { createRouter } from "@backend/plugins/services";

import changePassword from "./change-password";
import create from "./create";
import detail from "./detail";
import update from "./update";
import _delete from "./delete";
import pagination from "./pagination";

const userRouter = createRouter({
	detail: { tags: ["Users"] }
})
	.use(changePassword)
	.use(create)
	.use(detail)
	.use(update)
	.use(_delete)
	.use(pagination);

export default userRouter;
