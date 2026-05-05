exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    username: {
      type: "varchar(32)", // 32 is below the 39 limit of GitHub usernames, to encourage shorter and more descriptive usernames
      notNull: true,
      unique: true,
    },
    email: {
      type: "varchar(254)", // 254 characters is the maximum length for a valid email address (https://www.rfc-editor.org/errata/eid1690)
      notNull: true,
      unique: true,
    },
    password: {
      type: "varchar(60)", // 60 characters is the maximum length for a SHA-256 hash (https://www.npmjs.com/package/bcrypt#hash-info)
      notNull: true,
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = () => false;
