function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({
        error: "Dados inválidos",
        details: result.error.issues
      });
    }

    request.body = result.data;
    return next();
  };
}

module.exports = validate;
