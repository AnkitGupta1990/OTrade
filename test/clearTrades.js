exports.handler = function(event, context, callback) {
const fs = require('fs');
var error = 'SUCCESS';
fs.writeFile("/tmp/test", "CLEAR", function(err) {
    if(err) {
	error = err;
        return console.log(err);
    }
});
var contentsdata = '';
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
