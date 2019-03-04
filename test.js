// var fs = require('fs')
// var path = require('path')
// var str = fs.readFileSync(path.resolve(__dirname, 'dist/server/keys/server.key')).toString()
// console.log(str)

// let str1 = `
// -----BEGIN RSA PRIVATE KEY-----
// MIICWwIBAAKBgQC9ZMAzum4S2/odBlkOxuJok3PV4Q8M2B4YtLIW4HNNb+NzsSWd
// sMY8rPdbab7sTQeadd2132D4yr0jBnTev+bEtcsIrrR3b1T9BMltvce25o4OJ3AL
// dJdNO8JxCZh4sfXQF34oMibE3QtXnHEPFCPUFFQAqtfdfKmfk1w/ROxISwIDAQAB
// AoGAGB8r56q3+EjyKx4y25HzJjSZjUUT4KPp+WWSRR2jMdqtUn/edZ4dMX8qJgdq
// 3LfW3xJiAZcIx8cynbJl0jUI1A7QhUUIZrpfpFSDC/SIxWTfk+95CnJuuusEGvnr
// +ltRXX4DpBeQtldp3BtVTaLcApRTVnzVuws2b7J7zaeuwLECQQDpRXqGiPADcaaM
// /dAKp2/vBNBNLVqq1lBCKyugo/EtaTI6TKKsWipJvA6wMtxQcjyN/5fzJypMTSnD
// x7k/0bRzAkEAz9jSKlO2sLrsl2d+65EVI7tkdtR/LkDHMCbOOgguG0TLRjPRi+iT
// 0wEnNf2zazj0WgO5CUPThDpjkJmUa3d+yQJAU0PCnX0JtyD9IzyB4xurH7UnKTU0
// NOC02zmPpBKAxwXSsO6j7kNs7s7aq1gsPebY6JLASUHEnmG4s7J51GblMwJAYEto
// 21lbi7eeg2rcv5DBBYP9QJykq64xWpqv8uz1R4bw0n6Rd8tyKVEgdIAszuFdPBL7
// eFJnPZy7ojO1MrDzGQJAQAtrbUr9gTB2/BNS09m1tt3iZqENeOVSa/XmzvjxGUzO
// U8EX64cPvdaTYE+/ZbOSa1e5elvxh5t1WHNzUOMvEQ==
// -----END RSA PRIVATE KEY-----`
// console.log(str1)

// //# 服务端代码
// var WebSocketServer = require('ws').Server,
//     wss = new WebSocketServer({port: 8080});

// // 连接池
// var clients = [];

// wss.on('connection', function(ws) {
//     // 将该连接加入连接池
//     clients.push(ws);
//     ws.on('message', function(message) {
//         // 广播消息
//         clients.forEach(function(ws1){
//             if(ws1 !== ws) {
//                 ws1.send(message);
//             }
//        })
//     });

//     ws.on('close', function(message) {
//         // 连接关闭时，将其移出连接池
//         clients = clients.filter(function(ws1){
//             return ws1 !== ws
//         })
//     });
// });


let ca = 
`-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQC9ZMAzum4S2/odBlkOxuJok3PV4Q8M2B4YtLIW4HNNb+NzsSWd
sMY8rPdbab7sTQeadd2132D4yr0jBnTev+bEtcsIrrR3b1T9BMltvce25o4OJ3AL
dJdNO8JxCZh4sfXQF34oMibE3QtXnHEPFCPUFFQAqtfdfKmfk1w/ROxISwIDAQAB
AoGAGB8r56q3+EjyKx4y25HzJjSZjUUT4KPp+WWSRR2jMdqtUn/edZ4dMX8qJgdq
3LfW3xJiAZcIx8cynbJl0jUI1A7QhUUIZrpfpFSDC/SIxWTfk+95CnJuuusEGvnr
+ltRXX4DpBeQtldp3BtVTaLcApRTVnzVuws2b7J7zaeuwLECQQDpRXqGiPADcaaM
/dAKp2/vBNBNLVqq1lBCKyugo/EtaTI6TKKsWipJvA6wMtxQcjyN/5fzJypMTSnD
x7k/0bRzAkEAz9jSKlO2sLrsl2d+65EVI7tkdtR/LkDHMCbOOgguG0TLRjPRi+iT
0wEnNf2zazj0WgO5CUPThDpjkJmUa3d+yQJAU0PCnX0JtyD9IzyB4xurH7UnKTU0
NOC02zmPpBKAxwXSsO6j7kNs7s7aq1gsPebY6JLASUHEnmG4s7J51GblMwJAYEto
21lbi7eeg2rcv5DBBYP9QJykq64xWpqv8uz1R4bw0n6Rd8tyKVEgdIAszuFdPBL7
eFJnPZy7ojO1MrDzGQJAQAtrbUr9gTB2/BNS09m1tt3iZqENeOVSa/XmzvjxGUzO
U8EX64cPvdaTYE+/ZbOSa1e5elvxh5t1WHNzUOMvEQ==
-----END RSA PRIVATE KEY-----`


// ca = `-----BEGIN PUBLIC KEY-----
// MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9ZMAzum4S2/odBlkOxuJok3PV
// 4Q8M2B4YtLIW4HNNb+NzsSWdsMY8rPdbab7sTQeadd2132D4yr0jBnTev+bEtcsI
// rrR3b1T9BMltvce25o4OJ3ALdJdNO8JxCZh4sfXQF34oMibE3QtXnHEPFCPUFFQA
// qtfdfKmfk1w/ROxISwIDAQAB
// -----END PUBLIC KEY-----
// `
// var fs = require('fs')
// var path = require('path')
// var io = require('socket.io-client')
// var cert = fs.readFileSync(path.resolve(__dirname, 'src/server/keys/server.csr')),


// socket = io.connect('https://192.168.252.87:13671/prometheus', {
//     autoConnect: false,
//     reconnection: false,
//     transports: ['websocket'],
//     ca: cert,
//     rejectUnauthorized: false
// });   
// socket.on('connect', () => {
//     console.log('connect')
// })
// socket.on('connect_error', (error) => {
//     console.log('connect_error', error)
// })   
// socket.once('error', (error) => {
//     console.log('error', error)
// })  

// socket.connect()



var https = require('https');
var fs = require('fs');

var options = {
  hostname: "192.168.252.87",
  port: 13671,
  path: '/',
  methed: 'GET',
  key: fs.readFileSync('src/server/cert/client.key'),
  cert: fs.readFileSync('src/server/cert/client.crt'),
  ca: [fs.readFileSync('src/server/cert/ca.crt')],
//   rejectUnauthorized: false
};

options.agent = new https.Agent(options);

var req = https.request(options, function(res) {
  res.setEncoding('utf-8');
  res.on('data', function(d) {
    console.log(d);
  });
});
req.end();

req.on('error', function(e) {
  console.log(e);
});