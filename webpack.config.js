if (process.env.NODE_MODULE === 'server') 
    module.exports = require('./webpack/webpack.config.server.js');
else if (process.env.NODE_MODULE === 'client') 
    module.exports = require('./webpack/webpack.config.client.js');    
else if (process.env.NODE_MODULE === 'amd') 
    module.exports = require('./webpack/webpack.config.server.amd.js');        
else if (process.env.NODE_MODULE === 'amd-common') 
    module.exports = require('./webpack/webpack.config.server.amd.common.js');
else if (process.env.NODE_MODULE === 'sfu') 
    module.exports = require('./webpack/webpack.config.sfu.js');    

    


  