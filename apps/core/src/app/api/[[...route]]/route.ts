import { handle } from "hono/vercel";
import app from "@/routes";

export const GET = handle(app);
export const POST = handle(app);
