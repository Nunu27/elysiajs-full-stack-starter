import type { Role } from "@backend/db/schema/auth";
import env from "@backend/env";
import redis from "@backend/services/redis";
import type { Session } from "@backend/types/session";
import { ToastItemSchema } from "@backend/types/toast";
import { failure } from "@backend/utils/response";
import { Elysia, t } from "elysia";

export default new Elysia({ name: "session" })
	.guard({
		cookie: t.Object({
			toast: t.Optional(ToastItemSchema),
			session: t.Optional(t.String())
		})
	})
	.resolve(async ({ cookie: { session } }) => {
		session.value ??= Bun.randomUUIDv7();

		return {
			sessionId: session.value!,
			session: await redis.get<Session>(session.value)
		};
	})
	.macro({
		guest: {
			beforeHandle({ session, status }) {
				if (session) return status(400, failure({ message: "Already logged in" }));
			}
		},
		protected: {
			async beforeHandle({ session, sessionId, status }) {
				if (session) await redis.expire(sessionId!, env.SESSION_TTL);
				else return status(401, failure({ message: "Unauthorized" }));
			},
			resolve({ session }) {
				return { session: session! };
			}
		},
		private(roles: Role[]) {
			return {
				async beforeHandle({ sessionId, session, status }) {
					if (!session) status(401, failure({ message: "Unauthorized" }));
					else if (roles.includes(session.role)) await redis.expire(sessionId!, env.SESSION_TTL);
					else return status(403, failure({ message: "Forbidden" }));
				},
				resolve({ session }) {
					return { session: session! };
				}
			};
		}
	})
	.as("global");
