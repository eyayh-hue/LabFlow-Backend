const jwt = require("jsonwebtoken");
const User = require("../Models/User");

exports.isAuth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      console.log("isAuth: no token");
      return res
        .status(401)
        .send({ errors: [{ msg: "Not authorized, no token" }] });
    }

    token = token.replace(/^(Bearer\s+)+/i, "").trim();

    if (!token || token === "null" || token === "undefined") {
      console.log("isAuth: token is empty / null");
      return res
        .status(401)
        .send({ errors: [{ msg: "Not authorized, invalid token" }] });
    }

    const decoded = jwt.verify(token, process.env.privateKey || "secretKey");

    // يدعم _id ولا id حسب كيفاش صنعت الـ token
    const userId = decoded._id || decoded.id;
    console.log("isAuth decoded:", decoded);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ errors: [{ msg: "User not found" }] });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("ERREUR isAuth:", error.message);
    res
      .status(401)
      .send({ errors: [{ msg: "Not authorized", error: error.message }] });
  }
};
