import { replaceTopicParams, type WSEvent } from "@backend/plugins/ws";
import { AnyElysia } from "elysia";

// =================================================================
// SECTION: Type Utilities
// =================================================================

type ExtractSubscribableEvents<Events extends readonly WSEvent[]> = Extract<
	Events[number],
	{ type: "server2client" | "inter" }
>;

type PublishableEventName<Events extends readonly WSEvent[]> =
	ExtractSubscribableEvents<Events>["name"];

type ExtractEventBody<
	Events extends readonly WSEvent[],
	TEventName extends string
> =
	Extract<Events[number], { name: TEventName }> extends { body: infer B }
		? B extends { static: infer S }
			? S
			: never
		: never;

type ExtractParams<T extends string> =
	T extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [K in Param | keyof ExtractParams<Rest>]: string }
		: T extends `${infer _Start}:${infer Param}`
			? { [K in Param]: string }
			: {};

type HasParams<T extends string> =
	ExtractParams<T> extends {}
		? keyof ExtractParams<T> extends never
			? false
			: true
		: false;

// =================================================================
// SECTION: Publish Function Factory
// =================================================================

export function createPublish<
	App extends AnyElysia,
	const Events extends readonly any[]
>(app: App, events: Events) {
	type EventName = PublishableEventName<Events>;

	function publish<TEventName extends EventName>(
		eventName: HasParams<TEventName> extends false ? TEventName : never,
		data: ExtractEventBody<Events, TEventName>
	): void;

	function publish<TEventName extends EventName>(
		eventName: HasParams<TEventName> extends true ? TEventName : never,
		data: ExtractEventBody<Events, TEventName>,
		params: ExtractParams<TEventName>
	): void;

	function publish<TEventName extends EventName>(
		eventName: TEventName,
		data: ExtractEventBody<Events, TEventName>,
		params?: ExtractParams<TEventName>
	): void {
		const event = events.find((e) => e.name === eventName);

		if (!event) {
			throw new Error(`Event "${String(eventName)}" not found`);
		}

		if (event.type !== "server2client" && event.type !== "inter") {
			throw new Error(
				`Event "${String(eventName)}" is not publishable (type: ${event.type})`
			);
		}

		const topic = params
			? replaceTopicParams(eventName, params as Record<string, unknown>)
			: eventName;

		app.server?.publish(topic, JSON.stringify(data));
	}

	return publish;
}

export function publish<
	App extends AnyElysia,
	const Events extends readonly any[],
	TEventName extends PublishableEventName<Events>
>(
	app: App,
	events: Events,
	...args: HasParams<TEventName> extends true
		? [
				eventName: TEventName,
				data: ExtractEventBody<Events, TEventName>,
				params: ExtractParams<TEventName>
			]
		: [eventName: TEventName, data: ExtractEventBody<Events, TEventName>]
): void {
	const publishFn = createPublish(app, events);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publishFn(args[0] as any, args[1], args[2] as any);
}

// =================================================================
// SECTION: Export Types
// =================================================================

export type PublishFunction<Events extends readonly any[]> = {
	<TEventName extends PublishableEventName<Events>>(
		eventName: HasParams<TEventName> extends false ? TEventName : never,
		data: ExtractEventBody<Events, TEventName>
	): void;
	<TEventName extends PublishableEventName<Events>>(
		eventName: HasParams<TEventName> extends true ? TEventName : never,
		data: ExtractEventBody<Events, TEventName>,
		params: ExtractParams<TEventName>
	): void;
};

export type {
	ExtractEventBody,
	ExtractParams,
	HasParams,
	PublishableEventName
};
