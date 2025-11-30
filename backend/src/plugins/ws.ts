import { Role } from "@backend/db/schema/auth";
import services, { createRouter } from "@backend/plugins/services";
import type { ServerWebSocket } from "bun";
import { Elysia, t, TSchema } from "elysia";
import { ElysiaWS } from "elysia/ws";

// =================================================================
// SECTION: Core Types and Enums
// =================================================================

export type WSEventType = "client2server" | "server2client" | "inter";

// Infer the decorator context from services
type InferDecorator<T> =
	T extends Elysia<any, infer Decorator, any, any, any, any, any>
		? Decorator extends { decorator: infer D }
			? D
			: never
		: never;

type ServicesDecorator = InferDecorator<typeof services>;

// WebSocket context that includes all decorators from services
export type WSContext = Omit<ElysiaWS<ServerWebSocket<any>, any>, "data"> & {
	data: ServicesDecorator;
};

// =================================================================
// SECTION: Type Utilities for Parameter Extraction
// =================================================================

// Extract parameter names from a route string (e.g., "lab/:id/device/:deviceId" -> { id: string; deviceId: string })
type ExtractParams<T extends string> =
	T extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [K in Param | keyof ExtractParams<Rest>]: string }
		: T extends `${infer _Start}:${infer Param}`
			? { [K in Param]: string }
			: {};

// Check if a string has any parameters
type HasParams<T extends string> =
	ExtractParams<T> extends {}
		? keyof ExtractParams<T> extends never
			? false
			: true
		: false;

// =================================================================
// SECTION: Event Handler and Event Types
// =================================================================

export type WSEventHandler<
	TBody extends TSchema = TSchema,
	TName extends string = string
> = (params: {
	ws: WSContext;
	body: TBody["static"];
	params: HasParams<TName> extends true ? ExtractParams<TName> : undefined;
}) => void | Promise<void>;

export type WSEvent<
	TBody extends TSchema = TSchema,
	TType extends WSEventType = WSEventType,
	TName extends string = string
> = TType extends "server2client"
	? {
			type: TType;
			body: TBody;
			name: TName;
			private?: Role[];
		}
	: {
			type: TType;
			body: TBody;
			name: TName;
			private?: Role[];
			handler: WSEventHandler<TBody, TName>;
		};

// =================================================================
// SECTION: Event Creation Factory
// =================================================================

// Overload for server2client events (no handler required)
export function createWSEvent<
	TBody extends TSchema,
	TName extends string
>(config: {
	type: "server2client";
	body?: TBody;
	name: TName;
	private?: Role[];
}): WSEvent<TBody, "server2client", TName>;

// Overload for client2server and inter events (handler required)
export function createWSEvent<
	TBody extends TSchema,
	TType extends "client2server" | "inter",
	TName extends string
>(config: {
	type?: TType;
	body?: TBody;
	name: TName;
	private?: Role[];
	handler: WSEventHandler<TBody, TName>;
}): WSEvent<TBody, TType, TName>;

export function createWSEvent<
	TBody extends TSchema,
	TType extends WSEventType,
	TName extends string
>(config: {
	type?: TType;
	body?: TBody;
	name: TName;
	private?: Role[];
	handler?: WSEventHandler<TBody, TName>;
}) {
	const type = config.type ?? "inter";

	if (type === "server2client") {
		return {
			type,
			body: config.body ?? t.Unknown(),
			name: config.name,
			private: config.private
		};
	}

	return {
		type,
		body: config.body ?? t.Unknown(),
		name: config.name,
		private: config.private,
		handler: config.handler!
	};
}

// =================================================================
// SECTION: Helper Functions
// =================================================================

export function replaceTopicParams(
	template: string,
	params: Record<string, unknown>
): string {
	return template.replace(/:(\w+)/g, (_, key) => {
		const value = params[key];
		return value !== undefined ? String(value) : `:${key}`;
	});
}

// =================================================================
// SECTION: Type Utilities for Event Payload Extraction
// =================================================================

export type ExtractEventPayload<Events extends readonly WSEvent[]> = {
	[K in Events[number] as K extends { type: "client2server" | "inter" }
		? K["name"]
		: never]: K extends { type: "client2server" | "inter" }
		? {
				event: K["name"];
				body: K["body"]["static"];
			}
		: never;
}[Events[number] extends { type: "client2server" | "inter" }
	? Events[number]["name"]
	: never];

// =================================================================
// SECTION: WebSocket Plugin Factory
// =================================================================

export default <const Events extends readonly WSEvent<any, any, any>[]>(
	customEvents: Events
) => {
	// -----------------------------------------------------------------
	// Type-level inference for discriminated unions
	// -----------------------------------------------------------------

	type SubscribableEvents = Extract<
		Events[number],
		{ type: "server2client" | "inter" }
	>;

	type CustomEventPayloads = {
		[K in Events[number] as K extends { type: "client2server" | "inter" }
			? K["name"]
			: never]: K extends {
			type: "client2server" | "inter";
			body: infer B extends TSchema;
			name: infer N extends string;
		}
			? HasParams<N> extends true
				? { event: N; body: B["static"] & { params: ExtractParams<N> } }
				: { event: N; body: B["static"] }
			: never;
	};

	type SubscribeEventPayloads = {
		[K in SubscribableEvents as K["name"]]: K extends {
			name: infer N extends string;
		}
			? HasParams<N> extends true
				? { event: "subscribe"; body: { event: N; params: ExtractParams<N> } }
				: { event: "subscribe"; body: { event: N } }
			: never;
	}[SubscribableEvents["name"]];

	type UnsubscribeEventPayloads = {
		[K in SubscribableEvents as K["name"]]: K extends {
			name: infer N extends string;
		}
			? HasParams<N> extends true
				? {
						event: "unsubscribe";
						body: { event: N; params: ExtractParams<N> };
					}
				: { event: "unsubscribe"; body: { event: N } }
			: never;
	}[SubscribableEvents["name"]];

	type DefaultEventPayloads = SubscribeEventPayloads | UnsubscribeEventPayloads;

	type UnionPayload =
		| CustomEventPayloads[keyof CustomEventPayloads]
		| DefaultEventPayloads;

	// -----------------------------------------------------------------
	// Runtime schema generation for subscribe/unsubscribe
	// -----------------------------------------------------------------

	const subscribableEvents = customEvents.filter(
		(e) => e.type === "server2client" || e.type === "inter"
	);
	const subscribableEventNames = subscribableEvents.map((e) => e.name);
	const subscribableEventSchema =
		subscribableEventNames.length > 0
			? subscribableEventNames.length === 1
				? t.Literal(subscribableEventNames[0]!)
				: t.Union(
						subscribableEventNames.map((name) => t.Literal(name)) as [
							any,
							any,
							...any[]
						]
					)
			: t.String();

	// -----------------------------------------------------------------
	// Default events (subscribe/unsubscribe)
	// -----------------------------------------------------------------

	const defaultEvents: WSEvent<any, any, any>[] = [
		{
			type: "client2server",
			name: "subscribe",
			body: t.Object({
				event: subscribableEventSchema
			}),
			handler: ({ ws, body }) => {
				const bodyWithParams = body as {
					event: string;
					params?: Record<string, unknown>;
				};
				const eventName = bodyWithParams.params
					? replaceTopicParams(bodyWithParams.event, bodyWithParams.params)
					: bodyWithParams.event;
				ws.subscribe(eventName);
			}
		},
		{
			type: "client2server",
			name: "unsubscribe",
			body: t.Object({
				event: subscribableEventSchema
			}),
			handler: ({ ws, body }) => {
				const bodyWithParams = body as {
					event: string;
					params?: Record<string, unknown>;
				};
				const eventName = bodyWithParams.params
					? replaceTopicParams(bodyWithParams.event, bodyWithParams.params)
					: bodyWithParams.event;
				ws.unsubscribe(eventName);
			}
		}
	];

	// -----------------------------------------------------------------
	// Event registration and schema building
	// -----------------------------------------------------------------

	const allEvents = [...defaultEvents, ...customEvents];
	const handleableEvents = allEvents.filter(
		(e) => e.type === "client2server" || e.type === "inter"
	);

	const eventMap = Object.fromEntries(
		handleableEvents.map((event) => [event.name, event])
	) as Record<string, WSEvent>;

	const eventSchemas = handleableEvents.map((event) => {
		const hasParams = event.name.includes(":");

		if (hasParams) {
			const paramNames = [...event.name.matchAll(/:(\w+)/g)].map(
				(match) => match[1]
			);
			const paramsSchema = t.Object(
				Object.fromEntries(paramNames.map((name) => [name, t.String()]))
			);

			return t.Object({
				event: t.Literal(event.name),
				body: t.Composite([event.body, t.Object({ params: paramsSchema })])
			});
		}

		return t.Object({
			event: t.Literal(event.name),
			body: event.body
		});
	});

	const bodySchema =
		eventSchemas.length === 1
			? eventSchemas[0]!
			: t.Union(eventSchemas as [any, any, ...any[]]);

	const typedBodySchema = bodySchema as TSchema & { static: UnionPayload };

	// -----------------------------------------------------------------
	// WebSocket route handler
	// -----------------------------------------------------------------

	return createRouter().ws("/ws", {
		body: typedBodySchema,
		async message(ws, payload) {
			if (!ws.data.session.data) {
				ws.send({ error: "Unauthorized" });
				ws.close();

				return;
			}

			const { event: eventName, body } = payload as UnionPayload;
			const event = eventMap[eventName];

			if (!event || event.type === "server2client") {
				ws.send({ error: `Unknown event: ${String(eventName)}` });
				return;
			}

			const session = ws.data.session.data;
			if (event.private && !event.private.includes(session.role)) {
				ws.send({ error: "Forbidden" });
				return;
			}

			try {
				await event.handler({
					ws,
					body: body as never,
					params: (body as { params?: unknown }).params as never
				});
			} catch (error) {
				ws.send({
					error: `Handler error: ${error instanceof Error ? error.message : String(error)}`
				});
			}
		},
		protected: false
	});
};
