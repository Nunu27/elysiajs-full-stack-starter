import { createHash } from "crypto";

export const md5 = (s: string) =>
	createHash("md5").update(s).digest("hex").slice(0, 24);
