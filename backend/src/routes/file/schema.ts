import { t } from "elysia/type-system";

export const UploadFileRequest = t.Object({
	file: t.File(),
	from: t.String({ minLength: 1 })
});

export const DeleteFileRequest = t.Object({
	from: t.String({ minLength: 1 })
});
