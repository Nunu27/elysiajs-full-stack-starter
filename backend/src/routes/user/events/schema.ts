import { t } from "elysia/type-system";

export const UserUpdateEventData = t.Object({
	id: t.String(),
	name: t.String(),
	email: t.String(),
	role: t.String(),
	createdAt: t.String(),
	updatedAt: t.String()
});

export const UserDeleteRequest = t.String({ format: "uuid" });
