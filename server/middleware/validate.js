/**
 * Express middleware factory: require named keys on req.body.
 * Returns 400 { error: '<field> is required' } for the first missing/empty value.
 */
export function requireFields(fields) {
  return (req, res, next) => {
    const body = req.body ?? {};
    for (const field of fields) {
      const value = body[field];
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
    }
    next();
  };
}
