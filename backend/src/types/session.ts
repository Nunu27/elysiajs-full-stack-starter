import type { Role } from "@backend/db/schema/auth";

export type Session = {
	id: string;
	role: Role;
	useCAS?: boolean;
};
