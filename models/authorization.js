const DEFAULT_ANONYMOUS_USER_FEATURES = [
  "read:activation_token",
  "create:session",
  "create:user",
];
const DEFAULT_UNACTIVATED_USER_FEATURES = ["read:activation_token"];
const DEFAULT_ACTIVATED_USER_FEATURES = ["create:session", "read:session"];

export {
  isAllowedTo,
  DEFAULT_ANONYMOUS_USER_FEATURES,
  DEFAULT_UNACTIVATED_USER_FEATURES,
  DEFAULT_ACTIVATED_USER_FEATURES,
};

function isAllowedTo(user, feature) {
  return user.features.includes(feature);
}
