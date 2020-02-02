var http = require('http');
var redis = require("redis");
var options = {
    host: '192.168.252.88',
    // retry_strategy: (strategy) => {
    //     console.log('33333333', strategy);
    //     // return 5 * 1000;

    // }
}
// var pub = new redis.createClient({host:'192.168.252.88' });
// var sub =  new redis.createClient({host:'192.168.252.88' });
// var pub = new redis.RedisClient({url:'//192.168.252.88' })
// var sub = new redis.RedisClient({url:'//192.168.252.88' })
// export function createClient(redis_url: string, options?: ClientOpts): RedisClient;
var sub = redis.createClient('//192.168.252.88')


// var db =  redis.createClient(options);
var msg_count = 0;
sub.id = "rrrrrrrrrrrrrrrrrr";
sub.max_attempts = 1;
// pub.max_attempts = 1;
sub.on("connect", function(...args) {
    console.log('connect', args)
})

sub.on("ready", function(...args) {
    console.log('ready')
    sub.publish("ready", "1111111")
    
})

// sub.on("disconnect", function(...args) {
//     console.log('disconnect', args)
// })

// sub.on("disconnected", function(...args) {
//     console.log('disconnected', args)
// })

sub.on("error", function(...args) {
    console.log('error', args)
})

sub.on("end", function(...args) {
    console.log('end', sub.connected)
})

sub.on("close", function(...args) {
    console.log('close', sub.connected)
})

setTimeout(() => {
    console.log('111')
    sub.quit();
}, 3000);
// sub.on("ready", function(...args) {

//     console.log('444444444', sub.id, sub._events)
//     sub.on("error", function(...args) {
//         console.log('222222222222', args)
//     })    
// })

// sub.on("subscribe", function (channel, count) {
//     console.log('subscribe', channel, count);
//     // pub.publish("a nice channel", "I am sending a message.");
//     // pub.publish("a nice channel", "I am sending a second message.");
//     // pub.publish("a nice channel", "I am sending my last message.");
// });


// sub.on("unsubscribe", function (channel, count) {
//     console.log('unsubscribe', channel, count);
// });

sub.on("message", function (channel, message) {
    console.log("sub channel " + channel + ": " + message);
    msg_count += 1;
});

// sub.subscribe("ready");
// pub.subscribe("a nice channel1");
// pub.publish("a nice channel", "I am sending a message.");


// db.set('key', 'value');
// db.expire('key', 5);
// db.exists('key', function (...args)  {
//     console.log(args)
// })

// function exists(timeout) {
//     setTimeout(() => {
//         db.exists('key', function (err, result)  {
//             if (result) {
//                 db.expire('key', 10);
//                 console.log(timeout, 'exist')
//                 exists(timeout + 1) 
//             } else {
//                 console.log(timeout, 'not exist')                
//             }
//         })  
//     }, timeout * 1000);
// }

// // exists(1);

// sub.hset('key', undefined, undefined, (...args) => {
//     console.log('hset', args)
// })
// sub.hlen('key', (...args) => {
//     console.log('hlen', args)
// })
// sub.exists('key', (err, value) => {
//     console.log('exists', err, value)
// })
// sub.hdel('key', 'undefined', (err, value) => {
//     console.log('hdel', err, value)
// })
// sub.hexists('key', 'undefined', (err, value) => {
//     console.log('hexists', err, value)
// })
// sub.exists('key', (err, value) => {
//     console.log('exists', err, value)
// })
// sub.del('key', (...args) => {
//     console.log('del', args)
// })
// sub.get('key', (...args) => {
//     console.log('get', args)
// })

// sub.publish("ready", "11111");

// sub.set("key", "value")
// sub.hset("key", "field", "value");

const array = [1,2,3,4];
async function test() {
    array.forEach(async key => {
        return new Promise((resovle, reject) => {
            setTimeout(() => {
                console.log(key);    
                resovle();
            }, 1000);
    
        })
        
    })
    console.log('111111111111')

}

test();

var server = http.createServer();
server.listen();