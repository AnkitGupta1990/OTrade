exports.handler = function(event, context, callback) {
console.log("Writing file...");
  callback(null, {
    statusCode: 200,
    body: "Hello, World"
  });
};
