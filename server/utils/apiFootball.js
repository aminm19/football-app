const BASE_URL = 'https://v3.football.api-sports.io';

async function callApiFootball(endpoint) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY,
      },
    });
  } catch (err) {
    // Network-level failure (no connection, DNS, timeout, etc.)
    throw new Error(`Failed to reach API-Football: ${err.message}`);
  }

  // HTTP-level failure (4xx, 5xx — including 429 rate limit)
  if (!response.ok) {
    throw new Error(
      `API-Football returned ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // API-level failure: HTTP 200 but the payload reports errors
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(
      `API-Football error: ${JSON.stringify(data.errors)}`
    );
  }

  return data;
}

module.exports = callApiFootball;