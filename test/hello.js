exports.handler = function(event, context, callback) {
console.log("writing file");
const fs = require('fs');
fs.writeFile("/tmp/test", "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
  callback(null, {
    statusCode: 200,
    body: "Hello, World"
  });
};
