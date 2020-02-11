var http = require('http');
var Redis = require("ioredis");
var redisNode = {
    port: 6379,
    host: '127.0.0.1',
    password: 'mdmmdmmdm',
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
    enableReadyCheck: true,
    clusterRetryStrategy: (times, err) => {
        console.log('clusterRetryStrategy', times)
    },
    retryStrategy: (times, err) => {
        console.log('retryStrategy', times)
        var delay = Math.min(times * 50, 1000);
        
        return delay;

    }
}

var sub = new Redis(redisNode, options)

sub.on('connect', () => {
    console.log('on connect', sub.status)
})
sub.on('ready', () => {
    console.log('on ready', sub.status)
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
sub.on('+node', () => {
    console.log('on +node')
})
sub.on('+node', () => {
    console.log('on +node')
})
sub.on('node error', () => {
    console.log('on node error')
})



async function test() {
    await sub.hset('aaaaa', 'bbbbb', 'ccccc')
    var result = await sub.hget('aaaaa', 'bbbbb')
    console.log('1111', result)
    result = await sub.hkeys('aaaaab')
    console.log('22222', result)
}

test()




var server = http.createServer();
server.listen();