import { hash, compare } from "bcryptjs";

async function hashObjectPassword(object) {
  return Object.assign({}, object, {
    password: await hashPassword(object.password),
  });
}

async function hashPassword(password) {
  return await hash(password, 10);
}

async function comparePassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

export { hashPassword, comparePassword, hashObjectPassword };
