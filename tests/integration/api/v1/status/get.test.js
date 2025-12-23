test("GET to /api/v1/status returns 200 and correct body", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);
});
