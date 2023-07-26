const { PORT, DOMAIN } = process.env;

module.exports = {
  port: PORT || 7445,
  domain: DOMAIN || `http://localhost:${PORT}`,
};
