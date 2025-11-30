import { roleEnum } from "@backend/db/schema";
import { t } from "elysia";

export const ChangePasswordRequest = t.Object({
	newPassword: t.String({
		minLength: 8,
		maxLength: 128
	}),
	confirmPassword: t.String({
		minLength: 8,
		maxLength: 128
	})
});

export const CreateUserRequest = t.Object({
	name: t.String({ minLength: 1 }),
	email: t.String({ format: "email" }),
	role: t.UnionEnum(roleEnum.enumValues),
	password: t.String({
		minLength: 8,
		maxLength: 128
	})
});

export const UpdateUserRequest = t.Object({
	name: t.String({ minLength: 1 }),
	email: t.String({ format: "email" }),
	role: t.UnionEnum(roleEnum.enumValues)
});
