// body: router.post("/", validate(schema), handler)
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body); // throws ZodError -> error handler
  next();
};

// query string: router.get("/", validateQuery(schema), handler)
export const validateQuery = (schema) => (req, _res, next) => {
  req.query = schema.parse(req.query);
  next();
};
