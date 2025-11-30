export const SortOrder = ["asc", "desc"] as const;
export type SortOrder = (typeof SortOrder)[number];

export const FilterOp = [
	"eq",
	"ne",
	"gt",
	"gte",
	"lt",
	"lte",
	"like",
	"ilike",
	"nlike",
	"bt",
	"nb"
] as const;
export type FilterOp = (typeof FilterOp)[number];
