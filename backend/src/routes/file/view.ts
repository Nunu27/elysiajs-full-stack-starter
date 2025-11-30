import { createRouter } from "@backend/plugins/services";

export default createRouter().get(
	"/:name",
	async ({ session, params, storage, set, status }) => {
		if (!session) return status(401);

		let response = await storage.getObjectResponse(params.name);
		if (!response) return status(404);

		set.headers.etag = response.headers.get("etag") ?? undefined;
		set.headers["content-type"] = response.headers.get("content-type") ?? undefined;
		set.headers["last-modified"] = response.headers.get("last-modified") ?? undefined;

		return await response.arrayBuffer();
	},
	{
		protected: false,
		detail: {
			description: "Get a file"
		}
	}
);
