const { body, validationResult } = require("express-validator");

exports.verifSignUp = [
  body("name", "Name is required").notEmpty(),
  body("email", "Not a valid email").isEmail(),
  body(
    "password",
    "Your password must contain At least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 number, 1 symbol",
  ).isStrongPassword(),
  body("confirmPassword", "Passwords do not match").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
  body("role", "Role must be Patient, Biologiste or Admin").isIn([
    "Patient",
    "Biologiste",
    "Admin",
    "SubAdmin"
  ]),
];

exports.verifSignIn = [
  body("email", "Email or Username is required").notEmpty(),
  body("password", "Password is required").notEmpty(),
];

exports.validation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors);
  }
  next();
};
