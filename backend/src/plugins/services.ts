import db from "@backend/db";
import caching from "@backend/middlewares/caching";
import session from "@backend/middlewares/session";
import documentation from "@backend/plugins/documentation";
import errorHandler from "@backend/plugins/error-handler";
import fallback from "@backend/plugins/fallback";
import logging from "@backend/plugins/logging";
import security from "@backend/plugins/security";
import { events } from "@backend/routes/events";
import redis from "@backend/services/redis";
import storage from "@backend/services/storage";
import { createPublish } from "@backend/utils/ws-publish";
import { Elysia, type ElysiaConfig } from "elysia";

const baseServices = new Elysia({ name: "services" })
	.use(security)
	.use(logging)
	.use(documentation)
	.use(fallback)
	.use(errorHandler)
	.decorate("storage", storage)
	.decorate("redis", redis)
	.decorate("db", db)
	.use(session)
	.use(caching)
	.as("global");

const services = baseServices.decorate(
	"publish",
	createPublish(baseServices, events)
);

export default services;
export const createRouter = <Prefix extends string = "">(
	config?: ElysiaConfig<Prefix>
) => new Elysia(config).use(services);
