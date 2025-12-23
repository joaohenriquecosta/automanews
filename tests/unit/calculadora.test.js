const calculadora = require("../../models/calculadora.js");

test("2+2 = 4", () => {
  expect(calculadora.somar(2, 2)).toBe(4);
});

test("2+3 = 5", () => {
  expect(calculadora.somar(2, 3)).toBe(5);
});
