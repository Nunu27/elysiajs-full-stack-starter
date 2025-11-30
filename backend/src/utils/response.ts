export const success = <
	TData extends unknown = undefined,
	TMessage extends string | undefined = undefined
>({
	data,
	message
}: {
	data?: TData;
	message?: TMessage;
} = {}) => {
	return {
		success: true as const,
		...(data !== undefined && { data }),
		...(message !== undefined && { message })
	} as TData extends undefined
		? TMessage extends undefined
			? { success: true }
			: { success: true; message: TMessage }
		: TMessage extends undefined
			? { success: true; data: TData }
			: { success: true; data: TData; message: TMessage };
};

export const failure = <
	TMessage extends string,
	TErrors extends unknown = undefined
>({
	errors,
	message
}: {
	errors?: TErrors[];
	message: TMessage;
}) => {
	return {
		success: false as const,
		message,
		...(errors !== undefined && { errors })
	} as TErrors extends undefined
		? { success: false; message: TMessage }
		: { success: false; message: TMessage; errors: TErrors[] };
};
