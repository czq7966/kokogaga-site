var fs = require('fs')
var path = require('path')
var request = require('request')
var readdirp = require('readdirp')

var host = 'sdpcs.beta.web.sdp.101.com'
// cs服务名称
var serviceName = 'xxxx'
// 输入
var uploadRoot = '../h5player/latest'
// 输出
var csFilePath = '/' + serviceName + '/h5player/latest'

getToken(function (tokenInfo) {
  uploadFilesToCs(tokenInfo)
})

function getToken(callback) {
  request.post({
    url: 'http://' + host + '/v0.1/test/direct/getToken?serviceName=' + serviceName,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      params: null,
      path: csFilePath,
      token_type: 'UPLOAD_NORMAL'
    })
  }, function (err, response, body) {
    if (err) {
      return console.error('getToken failed:', err)
    }
    var tokenInfo = JSON.parse(body)
    callback(tokenInfo)
  })
}

function uploadFilesToCs(tokenInfo) {
  readdirp({
    root: path.resolve(__dirname, uploadRoot)
  }).on('data', function (entry) {
    uploadFile(tokenInfo, entry.parentDir.replace(new RegExp('\\\\', 'g'), '/'), entry.name)
  })
}

function uploadFile(tokenInfo, dir, name) {
  var url = 'http://' + host + '/v0.1/upload?token=' + tokenInfo.token + '&policy=' + tokenInfo.policy + '&date=' + encodeURIComponent(tokenInfo.date_time)
  var formData = {
    filePath: csFilePath + '/' + dir + '/' + name,
    serviceName: serviceName,
    scope: 1,
    mime: 'application/json',
    file: fs.createReadStream(path.resolve(__dirname, uploadRoot, dir ,name)),
  }
  // console.log(formData.filePath)
  // console.log('upload: ', url)
  request.post({
    url: url,
    formData: formData
  }, function (err, response, body) {
    if (err) {
      return console.error('upload failed:', err)
    }
    console.log('Upload successful!  remotePath:', JSON.parse(body).path)
  })
}
