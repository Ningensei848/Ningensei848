const fs = require("fs");

const TOKEN_REFRESH_URL = "https://graph.facebook.com/v20.0/oauth/access_token";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function refreshToken() {
  const clientId = getRequiredEnv("META_APP_ID");
  const clientSecret = getRequiredEnv("META_APP_SECRET");
  const currentToken = getRequiredEnv("INSTAGRAM_ACCESS_TOKEN");

  const url = new URL(TOKEN_REFRESH_URL);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", currentToken);

  const response = await fetch(url);
  const responseBody = await response.text();

  if (!response.ok) {
    console.error(`Token refresh failed with status ${response.status}.`);
    console.error(responseBody);
    throw new Error("Failed to refresh Instagram access token.");
  }

  const data = JSON.parse(responseBody);
  const newToken = data.access_token;

  if (!newToken) {
    throw new Error("Token refresh response did not include access_token.");
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_token=${newToken}\n`);
  } else {
    console.log("Instagram access token refreshed successfully.");
  }
}

refreshToken().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
