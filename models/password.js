import { hash, compare } from "bcryptjs";

export { comparePassword, hashObjectPassword };

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
