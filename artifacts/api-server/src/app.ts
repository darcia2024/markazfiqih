import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
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
// Allow requests from the frontend. Set FRONTEND_URL in the environment to
// restrict to a specific origin (e.g. the Vercel deployment URL). Falls back
// to '*' so the API works out-of-the-box in development and before the
// frontend domain is known.
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
