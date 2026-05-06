const DEFAULT_ANONYMOUS_USER_FEATURES = [
  "read:activation_token",
  "create:session",
  "create:user",
];
const DEFAULT_UNACTIVATED_USER_FEATURES = ["read:activation_token"];
const DEFAULT_ACTIVATED_USER_FEATURES = [
  "create:session",
  "read:session",
  "update:user",
];

export {
  isAuthorized,
  filterOutput,
  DEFAULT_ANONYMOUS_USER_FEATURES,
  DEFAULT_UNACTIVATED_USER_FEATURES,
  DEFAULT_ACTIVATED_USER_FEATURES,
};

function isAuthorized(user, feature, resource) {
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
