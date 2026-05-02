export { isAllowedTo };

function isAllowedTo(user, feature) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  return authorized;
}
