import { waitForAllServices, clearDatabase } from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator";
import { validate as uuidValidate, version as uuidVersion } from "uuid";

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    describe("With unique and valid data", () => {
      test("The user is created successfully and returned the correct data", async () => {
        const response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "valid_user",
            email: "unique_email@test.dev",
            password: "unique_and_valid",
          }),
        });

        const responseBody = await response.json();

        expect(response.status).toBe(201);
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: responseBody.username,
          email: responseBody.email,
          password: responseBody.password,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        expect(uuidValidate(responseBody.id)).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });
    });
    describe("With duplicated 'email'", () => {
      test("The first user is created successfully", async () => {
        const response1 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "duplicated_email_1",
            email: "duplicated_email@test.dev",
            password: "duplicated_email_password_1",
          }),
        });

        expect(response1.status).toBe(201);
      });
      test("The second user is not created and an error is returned", async () => {
        const response2 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "duplicated_email_2",
            email: "DUPLICATED_EMAIL@TEST.DEV",
            password: "duplicated_email_password_2",
          }),
        });

        expect(response2.status).toBe(400);

        const responseBody2 = await response2.json();
        expect(responseBody2).toEqual({
          name: "ValidationError",
          status_code: 400,
          message: "O email 'DUPLICATED_EMAIL@TEST.DEV' já está em uso.",
          action:
            "Forneça um email novo ou faça login com o email já existente.",
        });
      });
    });
    describe("With duplicated 'username'", () => {
      test("The first user is created successfully", async () => {
        const response1 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "duplicated_username",
            email: "duplicated_username1@test.dev",
            password: "duplicated_username_password_1",
          }),
        });

        expect(response1.status).toBe(201);
      });
      test("The second user is not created and an error is returned", async () => {
        const response2 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "DUPLICATED_USERNAME",
            email: "duplicated_username2@test.dev",
            password: "duplicated_username_password_2",
          }),
        });

        expect(response2.status).toBe(400);

        const responseBody2 = await response2.json();
        expect(responseBody2).toEqual({
          name: "ValidationError",
          status_code: 400,
          message: "O username 'DUPLICATED_USERNAME' já está em uso.",
          action:
            "Forneça um username novo ou faça login com o username já existente.",
        });
      });
    });
  });
});
