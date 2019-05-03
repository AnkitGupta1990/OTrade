exports.handler = function(event, context, callback) {
const fs = require('fs');
var error = 'SUCCESS';
fs.writeFile("/tmp/test", "--CLEAR--", function(err) {
    if(err) {
	error = err;
        return console.log(err);
    }
});
  callback(null, {
    statusCode: 200,
    body: error
  });
};
