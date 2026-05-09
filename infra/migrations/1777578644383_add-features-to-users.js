exports.up = (pgm) => {
  pgm.addColumn("users", {
    features: {
      type: "varchar[]",
      default: "{}",
      notNull: true,
    },
  });
};

exports.down = false;
