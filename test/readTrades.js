exports.handler = function(event, context, callback) {
var contentsdata = '';
const fs = require('fs');
fs.readFile('/tmp/test', 'utf8', function(err, contents) {
    contentsdata = contents;
});
  callback(null, {
    statusCode: 200,
    body: contentsdata
  });
};
