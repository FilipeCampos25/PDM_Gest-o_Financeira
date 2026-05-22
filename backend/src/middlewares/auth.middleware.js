const jwt = require("jsonwebtoken");

function authMiddleware(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return response.status(401).json({
      error: "Token ausente"
    });
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return response.status(401).json({
      error: "Token inválido"
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    request.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email
    };

    return next();
  } catch (error) {
    return response.status(401).json({
      error: "Token inválido"
    });
  }
}

module.exports = authMiddleware;
