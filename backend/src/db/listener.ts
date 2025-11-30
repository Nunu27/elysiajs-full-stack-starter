import env from "@backend/env";
import logger from "@backend/services/logger";
import type {
	BulkListenerCallback,
	ListenerCallback,
	ListenerEntry,
	Operations
} from "@backend/types/listener";
import { md5 } from "@backend/utils/crypto";
import type { ExtractTablesWithRelations, InferSelectModel } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import db from ".";

const client = await db.$client.connect();
type DB = typeof db;
type TFullSchema = DB["_"]["fullSchema"];
type TSchema = ExtractTablesWithRelations<TFullSchema>;

const MANAGED_PREFIX = "on_change";
const TRIGGER_PREFIX = "trg_onchg_";
const FUNC_PREFIX = "fn_onchg_";
const BATCH_SIZE = Math.max(1, Number(env.BATCH_SIZE ?? 64));
const DEBOUNCE_MS = Math.max(0, Number(env.DEBOUNCE_MS ?? 100));
const MAX_BATCH_WAIT_MS = Math.max(0, Number(env.MAX_BATCH_WAIT_MS ?? 500));

const registry = new Map<string, ListenerEntry[]>();
const batchQueue = new Map<
	string,
	{
		items: Array<{
			op: Operations;
			table: string;
			previous: any;
			current: any;
		}>;
		timer: NodeJS.Timeout | null;
		firstReceivedAt: number;
	}
>();

const trigNameFor = (channel: string) => `${TRIGGER_PREFIX}${md5(channel)}`;
const funcNameFor = (channel: string) => `${FUNC_PREFIX}${md5(channel)}`;

const qIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;
const qLiteral = (s: string) => `'${s.replace(/'/g, "''")}'`;
const areSetsEqual = (a: Set<unknown>, b: Set<unknown>) =>
	a.size === b.size && [...a].every((x) => b.has(x));

const getChannelForTable = <T extends PgTable>(table: T): string => {
	const { schema = "public", name } = getTableConfig(table);
	return `${MANAGED_PREFIX}:${schema}.${name}`;
};

const normalizeColumns = <T extends PgTable>(
	table: T,
	columns: (keyof InferSelectModel<T>)[]
): string[] => {
	const { columns: cols } = getTableConfig(table);
	return cols.reduce<string[]>((acc, col) => {
		if (columns.includes(col.name)) {
			acc.push(toSnakeCase(col.name));
		}
		return acc;
	}, []);
};

const processBatch = async (channel: string) => {
	const batch = batchQueue.get(channel);
	if (!batch || batch.items.length === 0) return;

	const items = batch.items.slice();
	batchQueue.delete(channel);

	const listeners = registry.get(channel);
	if (!listeners) return;

	const groupedByOp = items.reduce(
		(acc, item) => {
			if (!acc[item.op]) acc[item.op] = [];
			acc[item.op].push(item);
			return acc;
		},
		{} as Record<Operations, typeof items>
	);

	for (const [op, opItems] of Object.entries(groupedByOp)) {
		const listenersToCall = listeners.filter(({ events }) =>
			events.has(op as Operations)
		);

		if (listenersToCall.length === 0) continue;

		const bulkListeners = listenersToCall.filter(({ bulk }) => bulk);
		const nonBulkListeners = listenersToCall.filter(({ bulk }) => !bulk);

		if (bulkListeners.length > 0) {
			for (let i = 0; i < bulkListeners.length; i += BATCH_SIZE) {
				const chunk = bulkListeners.slice(i, i + BATCH_SIZE);
				const results = await Promise.allSettled(
					chunk.map(({ listener, columns }) => {
						const bulkData = opItems.map((item) => {
							const filteredPrevious = item.previous
								? Object.keys(item.previous).reduce((acc, key) => {
										if (columns.has(key)) {
											acc[key] = item.previous[key];
										}
										return acc;
									}, {} as any)
								: null;

							const filteredCurrent = item.current
								? Object.keys(item.current).reduce((acc, key) => {
										if (columns.has(key)) {
											acc[key] = item.current[key];
										}
										return acc;
									}, {} as any)
								: null;

							return { previous: filteredPrevious, current: filteredCurrent };
						});

						return (listener as BulkListenerCallback<any, any>)({
							op: op as Operations,
							table: opItems[0].table,
							data: bulkData
						});
					})
				);

				results.forEach((result) => {
					if (result.status === "rejected") {
						logger.error(
							{ error: result.reason },
							`DB Listener (bulk): Batch failure on channel ${channel}`
						);
					}
				});
			}
		}

		if (nonBulkListeners.length > 0) {
			for (let i = 0; i < nonBulkListeners.length; i += BATCH_SIZE) {
				const chunk = nonBulkListeners.slice(i, i + BATCH_SIZE);
				const results = await Promise.allSettled(
					chunk.map(({ listener, columns }) =>
						Promise.all(
							opItems.map((item) => {
								const filteredPrevious = item.previous
									? Object.keys(item.previous).reduce((acc, key) => {
											if (columns.has(key)) {
												acc[key] = item.previous[key];
											}
											return acc;
										}, {} as any)
									: null;

								const filteredCurrent = item.current
									? Object.keys(item.current).reduce((acc, key) => {
											if (columns.has(key)) {
												acc[key] = item.current[key];
											}
											return acc;
										}, {} as any)
									: null;

								return (listener as ListenerCallback<any, any>)({
									op: item.op,
									table: item.table,
									data: {
										previous: filteredPrevious,
										current: filteredCurrent
									}
								});
							})
						)
					)
				);

				results.forEach((result) => {
					if (result.status === "rejected") {
						logger.error(
							{ error: result.reason },
							`DB Listener: Batch failure on channel ${channel}`
						);
					}
				});
			}
		}
	}
};

const scheduleBatchProcessing = (channel: string) => {
	const batch = batchQueue.get(channel);
	if (!batch) return;

	const now = Date.now();
	const timeSinceFirst = now - batch.firstReceivedAt;

	if (batch.timer) {
		clearTimeout(batch.timer);
	}

	if (timeSinceFirst >= MAX_BATCH_WAIT_MS) {
		processBatch(channel);
		return;
	}

	const remainingWait = Math.min(
		DEBOUNCE_MS,
		MAX_BATCH_WAIT_MS - timeSinceFirst
	);

	batch.timer = setTimeout(() => {
		processBatch(channel);
	}, remainingWait);
};

client.on("notification", async ({ channel, payload }) => {
	if (!payload || !registry.has(channel)) return;

	let parsedPayload: {
		op: Operations;
		table: string;
		data: Array<{ previous: any; current: any }>;
	};
	try {
		parsedPayload = JSON.parse(payload);
	} catch (error) {
		logger.error({ error }, `DB Listener: Invalid JSON payload on ${channel}`);
		return;
	}

	if (!batchQueue.has(channel)) {
		batchQueue.set(channel, {
			items: [],
			timer: null,
			firstReceivedAt: Date.now()
		});
	}

	const batch = batchQueue.get(channel)!;

	if (Array.isArray(parsedPayload.data)) {
		parsedPayload.data.forEach((rowData) => {
			batch.items.push({
				op: parsedPayload.op,
				table: parsedPayload.table,
				previous: rowData.previous || null,
				current: rowData.current || null
			});
		});
	}

	scheduleBatchProcessing(channel);
});

export const addDBListener = <
	TEntity extends keyof TSchema,
	TTable extends TFullSchema[TEntity],
	TKeys extends keyof InferSelectModel<TTable>,
	TOps extends Array<Operations> = [],
	Bulk extends boolean = false
>(
	entity: TEntity,
	columns: TKeys[],
	listener: Bulk extends false
		? ListenerCallback<TTable, TOps[number], TKeys>
		: BulkListenerCallback<TTable, TOps[number], TKeys>,
	opts?: { ops?: TOps; bulk?: Bulk }
) => {
	const table = db._.fullSchema[entity];
	const channel = getChannelForTable(table);
	const normalizedCols = normalizeColumns(table, columns);
	const listeners = registry.get(channel) ?? [];

	listeners.push({
		columns: new Set(normalizedCols),
		events: new Set(opts?.ops ?? ["INSERT", "UPDATE", "DELETE"]),
		bulk: opts?.bulk ?? false,
		listener: listener as any
	});

	registry.set(channel, listeners);
};

export const removeDBListener = <
	TTable extends PgTable,
	TKeys extends keyof InferSelectModel<TTable>,
	TOps extends Array<Operations> = ["INSERT", "UPDATE", "DELETE"]
>(
	table: TTable,
	columns: TKeys[],
	listener:
		| ListenerCallback<TTable, TOps[number], TKeys>
		| BulkListenerCallback<TTable, TOps[number], TKeys>,
	opts?: { ops?: TOps; bulk?: boolean }
) => {
	const channel = getChannelForTable(table);
	const normalizedCols = normalizeColumns(table, columns);
	const listeners = registry.get(channel);
	if (!listeners) return;

	const opsSet = new Set(opts?.ops ?? ["INSERT", "UPDATE", "DELETE"]);
	const colsSet = new Set(normalizedCols);
	const bulk = opts?.bulk ?? false;
	const listenerIndex = listeners.findIndex(
		(entry) =>
			entry.listener === listener &&
			areSetsEqual(entry.events, opsSet) &&
			areSetsEqual(entry.columns, colsSet) &&
			entry.bulk === bulk
	);

	if (listenerIndex !== -1) {
		listeners.splice(listenerIndex, 1);
	}

	if (listeners.length === 0) {
		registry.delete(channel);
	}
};

function buildFunctionSQL(channel: string, columns: string[]): string {
	const fnName = funcNameFor(channel);
	const colsArray = columns.map(qLiteral).join(", ");

	return `
		CREATE OR REPLACE FUNCTION ${qIdent(fnName)}() RETURNS trigger AS $$
		DECLARE
		payload jsonb;
		data_array jsonb;
		BEGIN
		-- For statement-level triggers, we create an array of objects with previous and current
		IF TG_OP = 'DELETE' THEN
			data_array := (
				SELECT jsonb_agg(
					jsonb_build_object(
						'previous', (SELECT jsonb_object_agg(key, value)
									 FROM jsonb_each(to_jsonb(t))
									 WHERE key = ANY(ARRAY[${colsArray}]::text[])),
						'current', NULL
					)
				)
				FROM old_table t
			);
		ELSIF TG_OP = 'INSERT' THEN
			data_array := (
				SELECT jsonb_agg(
					jsonb_build_object(
						'previous', NULL,
						'current', (SELECT jsonb_object_agg(key, value)
									FROM jsonb_each(to_jsonb(t))
									WHERE key = ANY(ARRAY[${colsArray}]::text[]))
					)
				)
				FROM new_table t
			);
		ELSE -- UPDATE
			data_array := (
				SELECT jsonb_agg(
					jsonb_build_object(
						'previous', (SELECT jsonb_object_agg(key, value)
									 FROM jsonb_each(to_jsonb(old_t))
									 WHERE key = ANY(ARRAY[${colsArray}]::text[])),
						'current', (SELECT jsonb_object_agg(key, value)
									FROM jsonb_each(to_jsonb(new_t))
									WHERE key = ANY(ARRAY[${colsArray}]::text[]))
					)
				)
				FROM old_table old_t
				JOIN new_table new_t ON old_t.id = new_t.id
			);
		END IF;

		payload := jsonb_build_object(
			'op', TG_OP,
			'table', TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
			'data', COALESCE(data_array, '[]'::jsonb)
		);

		PERFORM pg_notify(${qLiteral(channel)}, payload::text);

		RETURN NULL;
		END;
		$$ LANGUAGE plpgsql;
	`;
}

function buildTriggerSQL(
	channel: string,
	schema: string,
	table: string,
	ops: Set<Operations>
): string {
	const fnName = qIdent(funcNameFor(channel));
	const qualifiedTable = `${qIdent(schema)}.${qIdent(table)}`;

	let sql = "";

	// Create a separate trigger for each operation since PostgreSQL doesn't support
	// transition tables (OLD TABLE/NEW TABLE) with multiple events in one trigger
	for (const op of ops) {
		const trigName = qIdent(`${trigNameFor(channel)}_${op.toLowerCase()}`);
		const referencing =
			op === "INSERT"
				? "REFERENCING NEW TABLE AS new_table"
				: op === "DELETE"
					? "REFERENCING OLD TABLE AS old_table"
					: "REFERENCING OLD TABLE AS old_table NEW TABLE AS new_table";

		sql += `
        DROP TRIGGER IF EXISTS ${trigName} ON ${qualifiedTable};
        CREATE TRIGGER ${trigName}
        AFTER ${op} ON ${qualifiedTable}
        ${referencing}
        FOR EACH STATEMENT
        EXECUTE FUNCTION ${fnName}();
    `;
	}

	return sql;
}

export const syncDBListeners = async () => {
	const desiredListeners = Array.from(registry.entries()).map(
		([channel, entries]) => {
			const [, fullTable] = channel.split(":");
			const [schema, table] = fullTable.split(".");

			const allColumns = entries.reduce((acc, { columns }) => {
				columns.forEach((col) => acc.add(col));
				return acc;
			}, new Set<string>());

			const allOps = entries.reduce((acc, { events }) => {
				events.forEach((op: Operations) => acc.add(op));
				return acc;
			}, new Set<Operations>());

			return {
				channel,
				schema,
				table,
				cols: Array.from(allColumns),
				events: allOps
			};
		}
	);

	const { currentChannels, existingTriggers } = await _getDBState();

	const desiredChannels = new Set(desiredListeners.map((d) => d.channel));
	const listenSQL = _getListenSQL(currentChannels, desiredChannels);

	const desiredTriggers = new Map<
		string,
		{
			channel: string;
			schema: string;
			table: string;
			cols: string[];
			events: Set<Operations>;
		}
	>();

	// Create entries for each operation separately since we now have one trigger per operation
	for (const d of desiredListeners) {
		for (const op of d.events) {
			const trigName = `${trigNameFor(d.channel)}_${op.toLowerCase()}`;
			const key = `${d.schema}.${d.table}:${trigName}`;
			desiredTriggers.set(key, {
				channel: d.channel,
				schema: d.schema,
				table: d.table,
				cols: d.cols,
				events: new Set([op])
			});
		}
	}

	const { addSQL, dropSQL } = _getTriggerDiffSQL(
		existingTriggers,
		desiredTriggers
	);

	const fullSQL = listenSQL + addSQL + dropSQL;
	if (fullSQL) {
		await client.query(fullSQL);
	}

	const stats = {
		addedTriggers: addSQL ? (addSQL.match(/CREATE TRIGGER/g) || []).length : 0,
		droppedTriggers: dropSQL ? (dropSQL.match(/DROP TRIGGER/g) || []).length : 0
	};

	if (stats.addedTriggers || stats.droppedTriggers) {
		logger.info(
			`DB Listener Sync: +${stats.addedTriggers}/-${stats.droppedTriggers}`
		);
	}
};

export const flushDBListeners = async () => {
	const channels = Array.from(batchQueue.keys());
	await Promise.all(channels.map((channel) => processBatch(channel)));
};

export const cleanupDBListeners = async () => {
	await flushDBListeners();

	for (const batch of batchQueue.values()) {
		if (batch.timer) {
			clearTimeout(batch.timer);
		}
	}

	batchQueue.clear();
	client.removeAllListeners("notification");
};

async function _getDBState() {
	const [channelsRes, triggersRes] = await Promise.all([
		client.query<{ channel: string }>(
			`SELECT pg_listening_channels() as channel`
		),
		client.query<{ schema: string; table: string; tgname: string }>(`
            SELECT n.nspname AS schema, c.relname AS table, t.tgname
            FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE NOT t.tgisinternal AND t.tgname LIKE ${qLiteral(
							`${TRIGGER_PREFIX}%`
						)}
        `)
	]);

	return {
		currentChannels: new Set(channelsRes.rows.map((r) => r.channel)),
		existingTriggers: new Set(
			triggersRes.rows.map((r) => `${r.schema}.${r.table}:${r.tgname}`)
		)
	};
}

function _getListenSQL(current: Set<string>, desired: Set<string>): string {
	const toListen = [...desired].filter((ch) => !current.has(ch));
	const toUnlisten = [...current].filter(
		(ch) => ch.startsWith(`${MANAGED_PREFIX}:`) && !desired.has(ch)
	);

	let sql = "";
	for (const ch of toUnlisten) sql += `UNLISTEN ${qIdent(ch)};\n`;
	for (const ch of toListen) sql += `LISTEN ${qIdent(ch)};\n`;
	return sql;
}

function _getTriggerDiffSQL(
	existing: Set<string>,
	desired: Map<
		string,
		{
			channel: string;
			schema: string;
			table: string;
			cols: string[];
			events: Set<Operations>;
		}
	>
) {
	let addSQL = "";
	let dropSQL = "";

	// Track which channels are still in use to avoid dropping their functions
	const channelsInUse = new Set<string>();
	for (const d of desired.values()) {
		channelsInUse.add(d.channel);
	}

	// Track which channels were in use before (from existing triggers)
	const previousChannels = new Set<string>();
	for (const key of existing) {
		const [schemaTable, tgname] = key.split(":");
		// Extract channel hash from trigger name (remove operation suffix if present)
		const baseTrigName = tgname.replace(/_(?:insert|update|delete)$/, "");
		const channelHash = baseTrigName.substring(TRIGGER_PREFIX.length);
		previousChannels.add(channelHash);
	}

	for (const key of existing) {
		if (!desired.has(key)) {
			const [schemaTable, tgname] = key.split(":");
			const [schema, table] = schemaTable.split(".");

			dropSQL += `DROP TRIGGER IF EXISTS ${qIdent(tgname)} ON ${qIdent(
				schema
			)}.${qIdent(table)};\n`;
		}
	}

	// Drop functions for channels that are no longer in use at all
	for (const channelHash of previousChannels) {
		const stillInUse = Array.from(channelsInUse).some((channel) => {
			return funcNameFor(channel).includes(channelHash);
		});

		if (!stillInUse) {
			const fnName = `${FUNC_PREFIX}${channelHash}`;
			dropSQL += `DROP FUNCTION IF EXISTS ${qIdent(fnName)}();\n`;
		}
	}

	// Group desired triggers by channel to create function only once per channel
	const channelToTriggers = new Map<
		string,
		typeof desired extends Map<any, infer V> ? V[] : never
	>();
	for (const [key, d] of desired) {
		if (!channelToTriggers.has(d.channel)) {
			channelToTriggers.set(d.channel, []);
		}
		channelToTriggers.get(d.channel)!.push(d);
	}

	const functionsCreated = new Set<string>();
	for (const [key, d] of desired) {
		const existingKey = Array.from(existing).find((k) => k === key);
		if (!existingKey) {
			// Create function once per channel
			if (!functionsCreated.has(d.channel)) {
				addSQL += buildFunctionSQL(d.channel, d.cols);
				functionsCreated.add(d.channel);
			}
			// Create trigger (one per operation)
			addSQL += buildTriggerSQL(d.channel, d.schema, d.table, d.events);
		}
	}

	if (addSQL) addSQL = `BEGIN;\n${addSQL}COMMIT;\n`;
	if (dropSQL) dropSQL = `BEGIN;\n${dropSQL}COMMIT;\n`;

	return { addSQL, dropSQL };
}
