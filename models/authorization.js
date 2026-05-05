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
