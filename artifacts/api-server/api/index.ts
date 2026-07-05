// Vercel Serverless Function entry point.
// This file wraps the Express app with serverless-http so Vercel can invoke
// it as a serverless function. All HTTP requests are routed here via the
// rewrites defined in vercel.json.
//
// The app itself is defined in ../src/app.ts and never calls app.listen()
// (that only happens in ../src/index.ts when running locally), so importing
// it here is safe and side-effect-free.

import serverless from "serverless-http";
import app from "../src/app";

export default serverless(app);
