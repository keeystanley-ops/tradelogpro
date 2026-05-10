const handler = require('../artifacts/api-server/dist/vercel-entry.cjs');
module.exports = handler.default || handler;
