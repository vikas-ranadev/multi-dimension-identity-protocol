const { PORT, DOMAIN } = process.env;

exports = {
  port: PORT || 7445,
  domain: DOMAIN || `http://localhost:${PORT}`,
};
