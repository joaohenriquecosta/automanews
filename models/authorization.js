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
  isAllowedTo,
  DEFAULT_ANONYMOUS_USER_FEATURES,
  DEFAULT_UNACTIVATED_USER_FEATURES,
  DEFAULT_ACTIVATED_USER_FEATURES,
};

function isAllowedTo(user, feature, resource) {
  if (!user.features.includes(feature)) {
    return false;
  }

  if (feature === "update:user") {
    const isSameUser = user.id === resource.id;
    return isSameUser || user.features.includes("update:user:others");
  }

  return true;
}
