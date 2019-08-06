const https = require('https');

exports.handler = function(event, context, callback) {
	getLiveDataPromise();
  	callback(null, {
    	statusCode: 200,
    	body: "SUCCESS"
  	});
};

async function getLiveDataPromise() {
  return new Promise((resolve, reject) => {
    var options = {
        host: "https://www.nseindia.com",
        port: 80,
        path: "live_market/dynaContent/live_watch/get_quote/ajaxFOGetQuoteJSON.jsp?underlying=YESBANK&instrument=OPTSTK&expiry=29AUG2019&type=CE&strike=86.00",
        method: "GET",
        headers: {
            "Referer": "https://www.nseindia.com/",
            "User-Agent" : "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)"
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
