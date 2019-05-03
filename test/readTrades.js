exports.handler = function(event, context, callback) {
const path = require('path');
const fs = require('fs');
fs.readdir(__dirname, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file); 
    });
});
  callback(null, {
    statusCode: 200,
    body: contentsdata
  });
};
