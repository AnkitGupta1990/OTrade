const https = require('https');

exports.handler = async ( event , context ) => { 
	console.log("loading");
	var result = await getLiveDataPromise(event.queryStringParameters.queryStr);
 	return { 
 		statusCode : 200 , 
 		body : result
 	};
}

async function getLiveDataPromise(queryStr) {
console.log(queryStr)
  return new Promise((resolve, reject) => {
    var options = {
        host: "www1.nseindia.com",
        //port: 443,
        path: queryStr,
        method: "GET",
        headers: {
            	"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:71.0) Gecko/20100101 Firefox/71.0",
		"Accept": "*/*",
		"Accept-Language": "en-US,en;q=0.5",
		//"Accept-Encoding": "gzip, deflate, br",
		"Referer": "https://www1.nseindia.com/",
		"X-Requested-With": "XMLHttpRequest",
		//"DNT": "1",
		//"Connection": "keep-alive"
        }
    };

    const req = https.request(options, (response) => {
      let chunks_of_data = [];

      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });

      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);
        resolve(response_body.toString());
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    req.end();
  });
}
async function getLiveData() {
  try {
    let http_promise = getLiveDataPromise();
    let response_body = await http_promise;
    console.log(response_body);
    return response_body;
  }
  catch(error) {
    console.log("Error :  " + error.message);
    throw error
  }
}
