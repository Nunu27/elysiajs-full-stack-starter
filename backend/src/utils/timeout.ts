export function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	errorMessage = "Request timeout"
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
		)
	]);
}
