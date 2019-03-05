if (process.env.NODE_MODULE === 'server') 
    module.exports = require('./webpack.config.server.js');
else if (process.env.NODE_MODULE === 'client') 
    module.exports = require('./webpack.config.client.js');    
else if (process.env.NODE_MODULE === 'android-server') 
    module.exports = require('./webpack.config.android.server.js');
else if (process.env.NODE_MODULE === 'amd-common') 
    module.exports = require('./webpack.config.server.amd.common.js');

    


  