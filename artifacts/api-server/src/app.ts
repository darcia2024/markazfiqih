import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
const pinoHttpMiddleware = pinoHttp as unknown as (options: any) => any;
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttpMiddleware({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Allow requests from the frontend. In production, FRONTEND_URL must be set
// to the deployed frontend origin — startup fails if it's missing. In
// development, permissive CORS is acceptable.
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.FRONTEND_URL) {
  throw new Error(
    "FRONTEND_URL wajib diisi di environment production untuk keamanan CORS.",
  );
}
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
