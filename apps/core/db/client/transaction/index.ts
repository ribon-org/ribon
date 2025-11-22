import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { postgresUrl } from "../../../utils/config/env";

const transactionClient = postgres(postgresUrl, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
});
export const transactionDB = drizzle(transactionClient);
