import { t } from "elysia";

export const CASRequestQuery = t.Object({
	ticket: t.Optional(t.String())
});

export const CASResponseSchema = t.Object({
	serviceResponse: t.Object({
		authenticationSuccess: t.Optional(
			t.Object({
				user: t.String(),
				attributes: t.Object({
					uid: t.String(),
					Name: t.String(),
					mail: t.String(),
					Status: t.String(),
					NRP: t.Number(),
					Jurusan: t.String(),
					netid: t.String()
				})
			})
		)
	})
});

export const LoginRequest = t.Object({
	email: t.String({ format: "email" }),
	password: t.String({
		minLength: 8,
		maxLength: 128
	})
});

export const ChangePasswordRequest = t.Object({
	oldPassword: t.String({
		minLength: 8,
		maxLength: 128
	}),
	newPassword: t.String({
		minLength: 8,
		maxLength: 128
	}),
	confirmPassword: t.String({
		minLength: 8,
		maxLength: 128
	})
});
