var http = require('http');
var Redis = require("ioredis");
// console.log('ffffffffff', zlib)
var zlib = require('zlib');
var zlib1 = require('zlib');
console.log('111111', process.env['PATH'])
console.log('111111', process.env)
// var input = Buffer.from('lorem ipsum dolor sit amet');
// zlib.deflate(input, (err, compressed) => {
    
//     console.log(typeof(compressed))
//     var msg = compressed.toString()
//     console.log('111', msg)
//     var buf = Buffer.from(msg)
//     zlib.inflate(buf, (err, uncompressed) => {
//         console.log(uncompressed.toString())
//     });
// });


var redisNode = {
    port: 6379,
    host: '127.0.0.1',
    db: 1
    // retry_strategy: (strategy) => {
    //     console.log('33333333', strategy);
    //     // return 5 * 1000;

    // }
}
var clusterNodes = [
     {
        host: '172.24.140.40',
        port: '11000',
        password: 'mdmmdmmdm',
        db: 1
    },
    {
        host: '172.24.140.40',
        port: '11001',
        password: 'mdmmdmmdm',
        db: 1
    },
    {
        host: '172.24.140.40',
        port: '11002',
        password: 'mdmmdmmdm',
        db: 1
    },
    {
        host: '172.24.140.40',
        port: '11003',
        password: 'mdmmdmmdm',
        db: 1
    },
    {
        host: '172.24.140.40',
        port: '11004',
        password: 'mdmmdmmdm',
        db: 1
    },
    {
        host: '172.24.140.40',
        port: '11005',
        password: 'mdmmdmmdm',
        db: 1
    }     
]
var options = {
    // enableReadyCheck: true,
    clusterRetryStrategy: (times, err) => {
        console.log('clusterRetryStrategy', times)
    },
    retryStrategy: (times, err) => {
        console.log('retryStrategy', times)
        var delay = Math.min(times * 50, 1000);
        
        return 1 * 1000;

    }
}

var sub = new Redis(redisNode, options)
var pub = new Redis(redisNode, options)
sub.subscribe('channel')
console.log('subscribe')
sub.on('connect', () => {
    console.log('on connect', sub.status)
})
var ready = false;
sub.on('ready', () => {
    if (!ready) {
        ready = true;
        console.log('on ready', sub.status)

    }


})
sub.on('error', () => {
    console.log('on error', sub.status)
})
sub.on('close', () => {
    console.log('on close', sub.status)
})
sub.on('reconnecting', () => {
    console.log('on reconnecting')
})
sub.on('end', () => {
    console.log('on end')
})
sub.on('+node', (node) => {
    console.log('on +node', node.status)
    node.on('connect', () => {
        console.log('node connect')
    })
})
sub.on('+node', () => {
    console.log('on +node')
})
sub.on('node error', () => {
    console.log('on node error')
})
sub.on('message', (channel, msg) => {
    console.log(typeof(msg))
    var buf = msg
    zlib.unzip(buf, (err,  res) => {
        // console.log(err)
        // msg = console.log(res.toString())
    })
    // console.log('on message', channel, msg)
})
sub.on("messageBuffer", (channel, message) => {
    console.log('messageBuffer1', message.toString().length)
    zlib1.gunzip(message, (err,  res) => {
        !err && console.log('messageBuffer2222', channel.toString(), res.toString())
    })
    
  });


setInterval(() => {
    // console.log('pub')
    // var msg = `{"cmdId":"signal_center_deliver","props":{"to":{"type":"room","id":"9CD9F239-F8AB-4F1B-98EF-665E02388C86"},"props":{"user":{"id":"81CF87E5-82DD-4431-A0A0-263815700C1D","sid":"103985","room":{"id":"9CD9F239-F8AB-4F1B-98EF-665E02388C86"},"socketId":"/promethean#vCGNExYk5iJyeLy0AAAB","serverId":"13A769E2-6DD6-4BC1-8A78-DF8B78EAEFEA"}},"cmdId":"adhoc_hello","type":1,"from":{"type":"user","id":"81CF87E5-82DD-4431-A0A0-263815700C1D"}},"extra":{"props":{"namespace":"promethean"},"from":{"type":"user","id":"81CF87E5-82DD-4431-A0A0-263815700C1D"},"to":{"type":"room","id":"9CD9F239-F8AB-4F1B-98EF-665E02388C86"}},"type":1,"from":{"type":"server","id":"13A769E2-6DD6-4BC1-8A78-DF8B78EAEFEA"},"to":{"type":"room","id":"9CD9F239-F8AB-4F1B-98EF-665E02388C86"}}`
    // zlib.gzip(msg, (err, buf) => {
    //     // console.log('11111', msg.length)
    //     // pub.publishBuffer('channel', buf)
    //     // .catch(e => {
    //     //     // console.log(e)
    //     // })
    //     // pub.publish('channel', msg)
    //     // .catch(e => {
    //     //     // console.log(e)
    //     // })
    // })

}, 2000);

async function test() {
    var v;
    await sub.set('aaa', 0)
    v = await sub.get('aaa')
    console.log('000', v)

    await sub.select(1)
    await sub.set('aaa', 1)
    v = await sub.get('aaa')
    console.log('111', v)  

    await sub.select(0) 
    v = await sub.get('aaa')
    console.log('0000', v)

    await sub.select(1) 
    v = await sub.get('aaa')
    console.log('1111', v)
}

// test()




var server = http.createServer();
server.listen();