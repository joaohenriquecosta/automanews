import { InternalServerError } from "infra/errors.js";

const PERMISSIONS = {
  default: {
    anonymousUser: [
      "read:activation_token",
      "create:session",
      "create:user",
      "read:status",
    ],
    unactivatedUser: ["read:activation_token"],
    activatedUser: ["create:session", "read:session", "update:user"],
  },
  catalog: {
    user: [
      "create:user",
      "read:user",
      "read:user:self",
      "update:user",
      "update:user:others",
    ],
    session: ["create:session", "read:session"],
    activation_token: ["read:activation_token"],
    migration: ["read:migration", "create:migration"],
    status: ["read:status", "read:status:all"],
  },
};

export { isAuthorized, filterOutput, PERMISSIONS };

function isAuthorized(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  if (feature === "update:user") {
    if (!resource || !user.features.includes("update:user")) {
      return false;
    }
    return (
      user.id === resource.id || user.features.includes("update:user:others")
    );
  }

  return user.features.includes(feature);
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
  if (feature === "read:user:self") {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        features: resource.features,
      };
    }
  }
  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        user_id: resource.user_id,
        token: resource.token,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }
  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      token: resource.token,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      used_at: resource.used_at,
    };
  }
  if (feature === "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }
  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        db: {
          max_connections: resource.dependencies.db.max_connections,
          opened_connections: resource.dependencies.db.opened_connections,
        },
      },
    };
    if (user.features.includes("read:status:all")) {
      output.dependencies.db.version = resource.dependencies.db.version;
    }
    return output;
  }
  return resource;
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: new Error(
        "Model `authorization.js` requires a `user` object with `features`.",
      ),
    });
  }
}

function validateFeature(feature) {
  if (!feature) {
    throw new InternalServerError({
      cause: new Error("Model `authorization.js` requires a valid `feature`."),
    });
  }

  for (const group of Object.values(PERMISSIONS)) {
    for (const features of Object.values(group)) {
      if (features.includes(feature)) {
        return;
      }
    }
  }

  throw new InternalServerError({
    cause: new Error("Model `authorization.js` requires a valid `feature`."),
  });
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: new Error("Model `authorization.js` requires a valid `resource`."),
    });
  }
}
