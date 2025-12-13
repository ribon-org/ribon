import { handle } from "hono/vercel";
import { Hono } from "hono";
import users from "./users";

export const app = new Hono().basePath("/api").route("/users", users);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
