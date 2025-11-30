import db from "@backend/db";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
