import cron from "cron";
import https from "https";

const apiUrl = process.env.API_URL;
const isProd = process.env.NODE_ENV === "production";
if (!apiUrl && isProd) {
  throw new Error("Missing required env: API_URL");
}

const job = new cron.CronJob("*/14 * * * *", function () {
  if (!apiUrl) {
    console.warn("CRON: API_URL is not set. Skipping scheduled GET request.");
    return;
  }

  https
    .get(apiUrl, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

export default job;
