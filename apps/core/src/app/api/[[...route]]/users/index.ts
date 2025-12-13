import { Hono } from "hono";
import storeUserName from "./storeUserName";

const app = new Hono().route("/", storeUserName);

export default app;
