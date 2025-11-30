import {
	and,
	asc,
	between,
	desc,
	eq,
	getTableColumns,
	gt,
	gte,
	ilike,
	isSQLWrapper,
	like,
	lt,
	lte,
	ne,
	notBetween,
	notLike,
	or,
	SQL,
	type BuildQueryResult,
	type ColumnDataType,
	type DBQueryConfig,
	type ExtractTablesWithRelations,
	type SQLWrapper
} from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTable } from "drizzle-orm/pg-core";
import { RelationalQueryBuilder } from "drizzle-orm/pg-core/query-builders/query";
import { createSelectSchema } from "drizzle-typebox";
import { t, type TSchema } from "elysia";
import { FilterOp, SortOrder } from "@backend/types/paginator";

// =================================================================
// SECTION: Constants and Core Types
// =================================================================

export { SortOrder, FilterOp };

const RANGE_OPS = ["bt", "nb"] as const;
type RangeOp = (typeof RANGE_OPS)[number];

const COLUMN_FILTER_OPS = {
	string: ["eq", "ne", "like", "ilike", "nlike"],
	number: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	bigint: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	date: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	localTime: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	localDate: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	localDateTime: ["eq", "ne", "gt", "gte", "lt", "lte", "bt", "nb"],
	boolean: ["eq", "ne"]
} as const;

const filterMap: Record<FilterOp, (col: any, val: any) => SQL | null> = {
	eq: (col, val) => eq(col, val),
	ne: (col, val) => ne(col, val),
	gt: (col, val) => gt(col, val),
	gte: (col, val) => gte(col, val),
	lt: (col, val) => lt(col, val),
	lte: (col, val) => lte(col, val),
	like: (col, val) => like(col, `%${val}%`),
	ilike: (col, val) => ilike(col, `%${val}%`),
	nlike: (col, val) => notLike(col, `%${val}%`),
	bt: (col, val) =>
		Array.isArray(val) && val.length === 2
			? between(col, val[0], val[1])
			: null,
	nb: (col, val) =>
		Array.isArray(val) && val.length === 2
			? notBetween(col, val[0], val[1])
			: null
};

type SupportedDataType = keyof typeof COLUMN_FILTER_OPS;

const getDataTypeFilterOps = <T extends ColumnDataType>(dataType: T) => {
	if (dataType in COLUMN_FILTER_OPS) {
		return COLUMN_FILTER_OPS[dataType as SupportedDataType];
	}
	return [];
};

// =================================================================
// SECTION: Drizzle Table Type Inference
// =================================================================

type ColumnKeys<T extends PgTable> = Extract<keyof T["_"]["columns"], string>;

type GetColumnDataType<
	TTable extends PgTable,
	K extends ColumnKeys<TTable>
> = TTable["_"]["columns"][K]["_"]["dataType"];

type ColumnData<
	TTable extends PgTable,
	K extends ColumnKeys<TTable>
> = TTable["_"]["columns"][K]["_"]["data"];

// Helper type to filter only columns that support ILIKE (string columns)
type SearchableColumnKeys<TTable extends PgTable> = {
	[K in ColumnKeys<TTable>]: GetColumnDataType<TTable, K> extends "string"
		? K
		: never;
}[ColumnKeys<TTable>];

type FilterType<
	TTable extends PgTable,
	TColumns extends ColumnKeys<TTable> = ColumnKeys<TTable>
> = {
	[K in TColumns]: GetColumnDataType<TTable, K> extends SupportedDataType
		? (typeof COLUMN_FILTER_OPS)[GetColumnDataType<
				TTable,
				K
			>] extends readonly (infer Op extends FilterOp)[]
			? Op extends RangeOp
				? {
						field: K;
						op: Op;
						value: [ColumnData<TTable, K>, ColumnData<TTable, K>];
					}
				: { field: K; op: Op; value: ColumnData<TTable, K> }
			: never
		: never;
}[TColumns];

type PaginationSchema<
	TTable extends PgTable,
	TColumns extends ColumnKeys<TTable> = ColumnKeys<TTable>,
	TSearchable extends boolean = boolean
> = {
	page: number;
	perPage: number;
	sortBy?: TColumns;
	sortOrder?: SortOrder;
	filters?: FilterType<TTable, TColumns>[];
} & (TSearchable extends true ? { search?: string } : {});

// =================================================================
// SECTION: Schema Generation
// =================================================================

const buildPaginationSchema = <TTable extends PgTable>(
	table: TTable,
	usableColumns?: string[],
	searchableColumns?: string[]
) => {
	const columns = getTableColumns(table);
	const selectSchema = createSelectSchema(table);
	const allColumnNames = Object.keys(
		selectSchema.properties
	) as ColumnKeys<TTable>[];

	// Filter columns based on usableColumns if provided
	const columnNames: string[] = usableColumns
		? allColumnNames.filter((name) => usableColumns.includes(name))
		: allColumnNames;

	const filterItems = columnNames.flatMap((columnName) => {
		const column = columns[columnName];
		const filterOps = getDataTypeFilterOps(column.dataType);
		if (!filterOps.length) return [];

		const columnSchema = (selectSchema.properties as Record<string, TSchema>)[
			columnName
		];
		const generatedSchemas: TSchema[] = [];

		const singleValueOps = filterOps.filter(
			(op): op is Exclude<FilterOp, RangeOp> =>
				!RANGE_OPS.includes(op as RangeOp)
		);
		const hasRangeOps = filterOps.some((op) =>
			RANGE_OPS.includes(op as RangeOp)
		);

		if (singleValueOps.length > 0) {
			generatedSchemas.push(
				t.Object(
					{
						field: t.Literal(columnName),
						op: t.UnionEnum(singleValueOps as [FilterOp, ...FilterOp[]]),
						value: columnSchema
					},
					{
						title: `${columnName} filter`
					}
				)
			);
		}

		if (hasRangeOps) {
			generatedSchemas.push(
				t.Object(
					{
						field: t.Literal(columnName),
						op: t.UnionEnum(RANGE_OPS),
						value: t.Tuple([columnSchema, columnSchema])
					},
					{
						title: `${columnName} range filter`
					}
				)
			);
		}
		return generatedSchemas;
	});

	// TypeBox's `t.Union` requires at least two items in its array.
	const filterSchema =
		filterItems.length === 0
			? t.Array(t.Never())
			: filterItems.length === 1
				? t.Array(filterItems[0])
				: t.Array(t.Union(filterItems));

	const baseSchema = {
		page: t.Integer({ default: 1, minimum: 1 }),
		perPage: t.Integer({ default: 10, minimum: 1, maximum: 100 }),
		sortBy: t.Optional(t.UnionEnum(columnNames as [string, ...string[]])),
		sortOrder: t.Optional(t.UnionEnum(SortOrder, { default: "asc" })),
		filters: t.Optional(filterSchema)
	};

	// Only include search if searchableColumns is provided and not empty
	if (searchableColumns && searchableColumns.length > 0) {
		return t.Object({
			...baseSchema,
			search: t.Optional(t.String({ minLength: 1 }))
		});
	}

	return t.Object(baseSchema);
};

const createPaginationSchema = <
	TTable extends PgTable,
	TColumns extends ColumnKeys<TTable> = ColumnKeys<TTable>,
	TSearchable extends boolean = false
>(
	table: TTable,
	usableColumns?: TColumns[],
	searchableColumns?: string[]
) => {
	return buildPaginationSchema(
		table,
		usableColumns,
		searchableColumns
	) as TSchema & {
		static: PaginationSchema<TTable, TColumns, TSearchable>;
	};
};

// =================================================================
// SECTION: Query Execution
// =================================================================

const buildFilterConditions = (
	filters: { field: string; op: FilterOp; value: any }[],
	columns: Record<string, any>
): SQL[] => {
	return filters.flatMap(({ field, op, value }) => {
		const column = columns[field];
		if (!column) return [];

		const condition = filterMap[op]?.(column, value);
		return condition ? [condition] : [];
	});
};

const buildSearchConditions = (
	search: string,
	searchableColumns: string[],
	columns: Record<string, any>
): SQL | undefined => {
	if (!search || searchableColumns.length === 0) return undefined;

	const searchConditions = searchableColumns.flatMap((columnName) => {
		const column = columns[columnName];
		if (!column) return [];

		// Use ILIKE for case-insensitive search on string columns
		return [ilike(column, `%${search}%`)];
	});

	return searchConditions.length > 0 ? or(...searchConditions) : undefined;
};

// =================================================================
// SECTION: Paginator Factory
// =================================================================

// TODO: add support for relations
export const createPaginator = <
	TFullSchema extends Record<string, unknown>,
	TRelationalSchema extends ExtractTablesWithRelations<TFullSchema>,
	TEntity extends keyof ExtractTablesWithRelations<TFullSchema>,
	TUsableColumns extends
		keyof TRelationalSchema[TEntity]["columns"] = keyof TRelationalSchema[TEntity]["columns"]
>(
	db: NodePgDatabase<TFullSchema>,
	entity: TEntity,
	config?: {
		usableColumns?: TUsableColumns[];
		searchableColumns?: SearchableColumnKeys<
			TFullSchema[TEntity] extends PgTable ? TFullSchema[TEntity] : never
		>[];
	}
) => {
	const tableConfig = db._.schema![entity];
	const { columns } = tableConfig;

	// Get the table type
	type TTable = TFullSchema[TEntity] extends PgTable
		? TFullSchema[TEntity]
		: never;
	const table = Object.values(columns)[0].table as TTable;

	type TColumns = Extract<TUsableColumns, string>;
	const usableColumnNames = config?.usableColumns as TColumns[] | undefined;
	const searchableColumnNames = config?.searchableColumns || [];
	const hasSearchable = searchableColumnNames.length > 0;

	const schema = createPaginationSchema<TTable, TColumns, typeof hasSearchable>(
		table,
		usableColumnNames,
		searchableColumnNames
	);

	type TFields = TRelationalSchema[TEntity];
	type TBaseOptions = DBQueryConfig<"many", true, TRelationalSchema, TFields>;

	const paginate = async <
		TOptions extends Omit<TBaseOptions, "limit" | "offset" | "orderBy">
	>(
		request: typeof schema.static,
		options?: TOptions
	) => {
		const { page, perPage, sortBy, sortOrder, filters } = request;
		const search = "search" in request ? request.search : undefined;
		const offset = (page - 1) * perPage;

		const filterConditions = filters?.length
			? buildFilterConditions(filters, columns)
			: [];
		const filter =
			filterConditions.length > 0 ? and(...filterConditions) : undefined;

		const searchCondition = search
			? buildSearchConditions(search, searchableColumnNames, columns)
			: undefined;

		// Combine filter and search conditions
		let combinedConditions: SQL | undefined;
		if (filter && searchCondition) {
			combinedConditions = and(filter, searchCondition);
		} else if (filter) {
			combinedConditions = filter;
		} else if (searchCondition) {
			combinedConditions = searchCondition;
		}

		let where: TOptions["where"];
		if (combinedConditions && options?.where) {
			if (isSQLWrapper(options.where)) {
				where = and(combinedConditions, options.where);
			} else {
				const whereFunc = options.where as Exclude<
					TOptions["where"],
					SQLWrapper | undefined
				>;

				where = (fields, ops) =>
					and(combinedConditions!, whereFunc(fields, ops));
			}
		} else {
			where = combinedConditions ?? options?.where;
		}

		const total = await db.$count(table, combinedConditions);

		const query = (db.query as any)[entity] as RelationalQueryBuilder<
			TRelationalSchema,
			TFields
		>;

		const items = await query.findMany({
			...options,
			where,
			orderBy: sortBy
				? (sortOrder === "desc" ? desc : asc)(columns[sortBy])
				: undefined,
			limit: perPage,
			offset
		});

		type Item = BuildQueryResult<TRelationalSchema, TFields, TOptions> & {
			index: number;
		};

		return {
			items: items.map((item, idx) => ({
				...item,
				index: offset + idx + 1
			})) as Item[],
			pageInfo: {
				page,
				perPage,
				total,
				totalPages: Math.ceil(total / perPage)
			}
		};
	};

	return {
		schema,
		paginate
	};
};
