import { isAuthorized, filterOutput } from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".isAuthorized(user, feature, resource)", () => {
    test("without `user`", () => {
      expect(() => {
        isAuthorized();
      }).toThrow(InternalServerError);
    });
    test("with unknown `feature`", () => {
      expect(() => {
        isAuthorized({ features: ["create:user"] }, "unknown:feature");
      }).toThrow(InternalServerError);
    });
    test("with valid `user` and `feature`", () => {
      expect(isAuthorized({ features: ["create:user"] }, "create:user")).toBe(
        true,
      );
    });
  });
  describe(".filterOutput(user, feature, resource)", () => {
    test("without `user`", () => {
      expect(() => {
        filterOutput();
      }).toThrow(InternalServerError);
    });
    test("with unknown `feature`", () => {
      expect(() => {
        filterOutput({ features: ["create:user"] }, "unknown:feature");
      }).toThrow(InternalServerError);
    });
    test("without `resource`", () => {
      expect(() => {
        filterOutput({ features: ["create:user"] }, "read:user");
      }).toThrow(InternalServerError);
    });
    describe("with valid `user`, `feature` and `resource`", () => {
      test("filters `user` object resource properly", () => {
        const resource = {
          id: "resource-id",
          username: "resource",
          email: "resource@test.com",
          features: [],
          created_at: new Date(),
          updated_at: new Date(),
          password: "resource",
        };
        const output = filterOutput(
          { features: ["read:user"] },
          "read:user",
          resource,
        );
        expect(output).toMatchObject({
          id: resource.id,
          username: resource.username,
          features: resource.features,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
        });
      });
    });
  });
});
