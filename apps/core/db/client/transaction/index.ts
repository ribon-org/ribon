import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { postgresUrl } from "../../../utils/config/env";

const MAX_CONNECTIONS = 5;
const IDLE_TIMEOUT_SECONDS = 30;
const CONNECT_TIMEOUT_SECONDS = 10;

const transactionClient = postgres(postgresUrl, {
  max: MAX_CONNECTIONS,
  idle_timeout: IDLE_TIMEOUT_SECONDS,
  connect_timeout: CONNECT_TIMEOUT_SECONDS,
  prepare: false,
});
export const transactionDB = drizzle(transactionClient);
