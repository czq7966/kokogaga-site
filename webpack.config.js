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
else if (process.env.NODE_MODULE === 'desktop-sender-app') 
    module.exports = require('./webpack/webpack.config.desktop.sender.app.js');    
else if (process.env.NODE_MODULE === 'desktop-sender-web') 
    module.exports = require('./webpack/webpack.config.desktop.sender.web.js');
else if (process.env.NODE_MODULE === 'mdm-receiver') 
    module.exports = require('./webpack/webpack.config.mdm.receiver.js');
else if (process.env.NODE_MODULE === 'mdm-server') 
    module.exports = require('./webpack/webpack.config.mdm.server.js');
else if (process.env.NODE_MODULE === 'sdp-probe') 
    module.exports = require('./webpack/webpack.config.sdp-probe.js');  
else if (process.env.NODE_MODULE === 'web-test') 
    module.exports = require('./webpack/webpack.config.web-test.js');
else if (process.env.NODE_MODULE === 'web-kokogaga') 
    module.exports = require('./webpack/webpack.config.web-kokogaga.js');        