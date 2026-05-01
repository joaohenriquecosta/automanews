export { getOrigin };

function getOrigin() {
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NODE_ENV === "production"
    ? "https://automanews.com.br"
    : "http://localhost:3000";
}
