import { hash, compare } from "bcryptjs";

export { comparePassword, hashObjectPassword, getAuthDummyPasswordHash };

let authDummyHashPromise;

/**
 * Bcrypt hash used when no user row exists, so login still runs one compare()
 * with the same cost as real passwords — reduces email enumeration via timing.
 */
async function getAuthDummyPasswordHash() {
  authDummyHashPromise ??= hashPassword("__auth_timing_dummy_v1__");
  return await authDummyHashPromise;
}

async function hashPassword(password) {
  const saltRounds = process.env.NODE_ENV === "production" ? 14 : 1;
  return await hash(password, saltRounds);
}

async function comparePassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

async function hashObjectPassword(object) {
  return Object.assign({}, object, {
    password: await hashPassword(object.password),
  });
}
