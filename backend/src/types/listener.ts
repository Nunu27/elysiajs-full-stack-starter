import type { InferSelectModel } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export type Operations = "INSERT" | "UPDATE" | "DELETE";

export type ListenerCallback<
	TTable extends PgTable,
	TOp extends Operations,
	TKeys extends keyof InferSelectModel<TTable> = keyof InferSelectModel<TTable>,
	TData = { [P in TKeys]: InferSelectModel<TTable>[P] }
> = (event: {
	op: TOp;
	table: TTable["_"]["name"];
	data: {
		previous: TOp extends "INSERT" ? null : TData;
		current: TOp extends "DELETE" ? null : TData;
	};
}) => Promise<void>;

export type BulkListenerCallback<
	TTable extends PgTable,
	TOp extends Operations,
	TKeys extends keyof InferSelectModel<TTable> = keyof InferSelectModel<TTable>,
	TData = { [P in TKeys]: InferSelectModel<TTable>[P] }
> = (event: {
	op: TOp;
	table: TTable["_"]["name"];
	data: Array<{
		previous: TOp extends "INSERT" ? null : TData;
		current: TOp extends "DELETE" ? null : TData;
	}>;
}) => Promise<void>;

export type ListenerEntry = {
	columns: Set<string>;
	events: Set<Operations>;
	bulk: boolean;
	listener:
		| ListenerCallback<any, any, any>
		| BulkListenerCallback<any, any, any>;
};
