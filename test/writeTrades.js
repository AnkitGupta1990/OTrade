exports.handler = function(event, context, callback) {
const fs = require('fs');
fs.appendFile("/tmp/test", event.body, function(err) {
    if(err) {
        return console.log(err);
    }
});
var contentsdata = '';
fs.readFile('/tmp/test', 'utf8', function(err, contents) {
    contentsdata = contents;
});
  callback(null, {
    statusCode: 200,
    body: contentsdata
  });
};
