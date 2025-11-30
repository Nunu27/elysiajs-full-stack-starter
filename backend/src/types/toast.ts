import { t } from "elysia/type-system";

export enum ToastType {
	Success = "success",
	Error = "error"
}

export const ToastItemSchema = t.Object({
	message: t.String(),
	type: t.Enum(ToastType)
});

export type ToastItem = typeof ToastItemSchema.static;
