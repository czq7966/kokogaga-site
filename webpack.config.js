if (process.env.NODE_MODULE === 'server') {
    module.exports = require('./webpack.config.server.js');
} else {
    module.exports = require('./webpack.config.client.js');
}

  