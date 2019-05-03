exports.handler = function(event, context, callback) {
var contentsdata = '';
const fs = require('fs');
fs.exists("/tmp/test", function(fileok){
console.log("fileok " + fileok); 
});
fs.readFile('/tmp/test', 'utf8', function(err, contents) {
console.log("data 0 " + contents); 
contentsdata = contents;
console.log("data " + contentsdata); 
});
  callback(null, {
    statusCode: 200,
    body: contentsdata
  });
};
