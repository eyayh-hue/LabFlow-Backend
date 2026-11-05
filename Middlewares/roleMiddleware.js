exports.verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(400).send({
        errors: [
          {
            msg: "Access denied: You don't have permission to access this resource",
          },
        ],
      });
    }
    next();
  };
};
