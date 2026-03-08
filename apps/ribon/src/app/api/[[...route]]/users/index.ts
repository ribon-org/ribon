import { Hono } from "hono";
import getUser from "./getUser";
import storeUserName from "./storeUserName";
import updateUserName from "./updateUserName";

const app = new Hono()
  .route("/", getUser)
  .route("/", storeUserName)
  .route("/", updateUserName);

export default app;
