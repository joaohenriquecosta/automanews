export { getOrigin };

function getOrigin() {
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.CI) {
    return "http://127.0.0.1:3000";
  }

  return process.env.NODE_ENV === "production"
    ? "https://automanews.com.br"
    : "http://localhost:3000";
}
