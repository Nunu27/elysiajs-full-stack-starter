import type { ValidationError } from "elysia";
import type { TUnionEnum } from "elysia/type-system/types";

export const formatError = (
	error: ValidationError["valueError"]
): { path: string; message: string }[] => {
	if (!error) return [];
	let { errors, path, message, type, schema } = error;

	if (errors.length) {
		if (type === 62) {
			const allMemberErrors = errors.map((err) => {
				const error = err.First();
				return formatError(error);
			});

			const leastErrors = allMemberErrors.reduce((min, current) => {
				return current.length < min.length ? current : min;
			}, allMemberErrors[0] || []);

			return leastErrors;
		}

		return errors.flatMap((err) => {
			const error = err.First();
			return formatError(error);
		});
	}

	if (type === 31 && message.includes("UnionEnum")) {
		message = `Expected one of the following values ${(
			schema as TUnionEnum
		).enum
			.map((v: unknown) => JSON.stringify(v))
			.join(", ")}`;
	}

	return [{ path, message }];
};
