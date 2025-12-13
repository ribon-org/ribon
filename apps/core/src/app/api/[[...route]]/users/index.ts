import { Hono } from "hono";
import storeUserName from "./storeUserName";
import updateUserName from "./updateUserName";

const app = new Hono().route("/", storeUserName).route("/", updateUserName);

export default app;
