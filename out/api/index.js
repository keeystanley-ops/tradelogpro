const handler = require('../api-dist/vercel-entry.cjs');
module.exports = handler.default || handler;
