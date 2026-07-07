import serverless from "serverless-http";
import app from "../dist/app.mjs";

export default serverless(app, {
  request(request, event, context) {
    request.url = event.path || request.url;
  }
});
