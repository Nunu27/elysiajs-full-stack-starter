import { t } from "elysia/type-system";

export const RequestWithId = t.Object({
	id: t.String({ format: "uuid" })
});
