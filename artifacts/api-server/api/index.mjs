import serverless from "serverless-http";
import app from "../dist/app.mjs";

export default serverless(app);
