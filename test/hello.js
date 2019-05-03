exports.handler = function(event, context, callback) {
console.log("writing file");
const fs = require('fs');
fs.writeFile("/tmp/test", "Hey there! NOW!!!", function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");

fs.readFile('/tmp/test', 'utf8', function(err, contents) {
    console.log("reading data from file " + contents);
});
 
console.log('after calling readFile');
});
  callback(null, {
    statusCode: 200,
    body: "Hello, World"
  });
};
