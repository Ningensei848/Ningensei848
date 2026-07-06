const GRAPH_API_BASE_URL = "https://graph.instagram.com";
const DEFAULT_GRAPH_API_VERSION = "v23.0";

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to fetch Instagram posts.`);
  }

  return value;
}

function getImageFromMedia(media) {
  return {
    alt: media.caption || "Instagram post image",
    source: media.permalink || media.media_url || media.thumbnail_url,
    url: media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url,
  };
}

class InstagramApiService {
  /**
   * Fetch recent images from the Instagram Graph API using Node.js global fetch.
   *
   * @param {string} acc Account identifier used as a fallback user id.
   * @param {number} n Qty of image to fetch.
   */
  async getLatestInstagramPostsFromAccount(acc, n) {
    const accessToken = getRequiredEnvironmentVariable("INSTAGRAM_ACCESS_TOKEN");
    const userId = process.env.INSTAGRAM_USER_ID || acc;
    const graphApiVersion =
      process.env.INSTAGRAM_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
    const url = new URL(
      `${GRAPH_API_BASE_URL}/${graphApiVersion}/${userId}/media`,
    );

    url.searchParams.set(
      "fields",
      "media_url,permalink,caption,media_type,thumbnail_url",
    );
    url.searchParams.set("limit", String(n));
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Instagram Graph API request failed with ${response.status}: ${errorBody}`,
      );
    }

    const payload = await response.json();

    if (!Array.isArray(payload.data)) {
      throw new Error("Instagram Graph API response did not include media data.");
    }

    return payload.data.map(getImageFromMedia).filter((image) => image.url);
  }
}

const instagramApiService = new InstagramApiService();

module.exports = instagramApiService;
