const connectToDatabase = require('./db')
const https = require('https');

function HTTPError (statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

module.exports.home = async () => {
  await connectToDatabase()
  console.log('DB Connection successful.')
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Welcome!!! DB Connection successful.' })
  }
}


function getSACallPromise(email,fhCompanyId,stage) {
  return new Promise((resolve, reject) => {
    var restPath = "/superadmin/rest/users/"+email+"/opportunities.ws?petal=Fairhair"
    if(fhCompanyId != null) {
      restPath = "/superadmin/rest/opportunityOwner/opportunityOwner.html?appAccountId="+fhCompanyId+"&petalName=Fairhair"
    }
    var options = {
        host: process.env.SA_HOST,
        port: process.env.SA_PORT,
        path: restPath,
        method: "GET",
        headers: {
            "Accept": "application/json"
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
    req.setTimeout(parseInt(process.env.SA_TIMEOUT,10),function() {
      reject(new HTTPError(500, `Something went wrong in SA`))
    })
    req.end();
  });
}

async function getDataFromSA(email,fhCompanyId,stage) {
  try {
    let http_promise = getSACallPromise(email,fhCompanyId,stage);
    let response_body = await http_promise;
    return response_body;
  }
  catch(error) {
    console.log("Error :  " + error.message);
    throw error
  }
}

module.exports.getOpportunityIds = async (event) => {
  try {
    var result = await getDataFromSA(event.pathParameters.email,null,event.stage)
    try {
      JSON.parse(result);
      try {
        updateOpportunityIdsInAWS(result,event.pathParameters.email); 
      } catch (dberror) {

      }
    } catch (err) {
      return await handleSAOpportunityIdsError(event.pathParameters.email)
    }
    return {
      statusCode: 200,
      headers: {
      	'Access-Control-Allow-Origin': '*',
     	'Access-Control-Allow-Credentials': true,
      },
      body: result
    }
  } catch (err) {
      return await handleSAOpportunityIdsError(event.pathParameters.email);
  }
}

async function handleSAOpportunityIdsError(email) {

  return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true },
      body: 'Internal Server Error'
    }
	
  /*try {
    var result = JSON.stringify(await getOpportunityIdsFromAWS(email));
    return {
      statusCode: 200,
      body: result
    }
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(err) || 'Could not find details.'
    }
  }*/
}

async function getOpportunityIdsFromAWS (email) {  
  const { OpportunityOwner,OwnerOpportunityId } = await connectToDatabase()
  const opportunityIdsByOwner = await OwnerOpportunityId.findAll({
                                          where: {
                                            email: email
                                          }})  
  if (!opportunityIdsByOwner || !opportunityIdsByOwner[0]) {
    return {"items": null,"errorMessage": "Opportunities Not Found","statusCode": 404};
  }
  var oppArray = [];
  opportunityIdsByOwner.forEach(addOpp);
  function addOpp(value, index, array) {
    oppArray.push({"opportunityId":value.opportunityId});
  }
  var result = {"items": oppArray,"errorMessage": "","statusCode": 200}
  return result
}

async function updateOpportunityIdsInAWS (jsonVal,email) {
  try {
    const input = JSON.parse(jsonVal)
    const { OpportunityOwner, OpportunityIdsByOwnerModel } = await connectToDatabase()
    const connection = await connectToDatabase.getConnection()
    await connection.query('delete from owner_opportunity_ids where email = "' + email + '"'); 
    input.items.forEach(insertRecord)
    async function insertRecord(value, index, array) {
      await connection.query('INSERT INTO owner_opportunity_ids (`email`, `opportunityId`, `createdAt`, `updatedAt`) \
                              values(' + '"'+email+'","'+value.opportunityId+'",'+ '\
                              NOW(),NOW())', function (error, results, fields) {
                                                                if (error) {
                                                                    throw error;
                                                                }});
    }
    return "SUCCESS"
  } catch (err) {
    console.log(err.message)
    return err
  }
}

module.exports.getOpportunityOwner = async (event) => {
  try {
    var result = await getDataFromSA(null,event.pathParameters.fhCompanyId,event.stage)
    try {
      JSON.parse(result);
      try {
        updateOpportunityOwnerInAWS(result,event.pathParameters.fhCompanyId); 
      } catch (dberror) {

      }
    } catch (err) {
      return await handleSAOpportunityOwnerError(event.pathParameters.fhCompanyId)
    }
    return {
      statusCode: 200,
      headers: {
      	'Access-Control-Allow-Origin': '*',
     	'Access-Control-Allow-Credentials': true,
      },
      body: result
    }
  } catch (err) {
      return await handleSAOpportunityOwnerError(event.pathParameters.fhCompanyId);
  }
}

async function handleSAOpportunityOwnerError(fhCompanyId) {

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true },
      body: 'Internal Server Error'
    }
	
  /*try {
    var result = JSON.stringify(await getOpportunityOwnerFromAWS(fhCompanyId));
    return {
      statusCode: 200,
      body: result
    }
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(err) || 'Could not find details.'
    }
  }*/
}

async function getOpportunityOwnerFromAWS (fhCompanyId) {
  const { OpportunityOwner } = await connectToDatabase()
  const opportunityOwner = await OpportunityOwner.findAll({
                                          where: {
                                            fhCompanyId: fhCompanyId
                                          }})
  var opportunityOwnerDetails = opportunityOwner[0];
  var result = {};
  if (!opportunityOwner || !opportunityOwnerDetails || !opportunityOwnerDetails.email || opportunityOwnerDetails.email == '') {
    result = {
                "email": null,
                "firstName": null,
                "middleName": null,
                "lastName": null,
                "customer": false,
                "supportEmail": null,
                "customerType": null,
                "errorMessage": "Fairhair Opportunity Owner not found for customerid:"+fhCompanyId,
                "errorCode": "NOT_FOUND",
                "phone": null
            }
  } else {
    result = {
               "email":   opportunityOwnerDetails.email,
               "firstName": opportunityOwnerDetails.firstName,
               "middleName": opportunityOwnerDetails.middleName,
               "lastName": opportunityOwnerDetails.lastName,
               "customer": opportunityOwnerDetails.customer,
               "supportEmail":  opportunityOwnerDetails.supportEmail,
               "customerType": opportunityOwnerDetails.customerType,
               "errorMessage": "",
               "errorCode": "OK",
               "phone": opportunityOwnerDetails.phone
              }
  }
  return result
}

async function updateOpportunityOwnerInAWS (jsonVal,fhCompanyId) {
  try {
    const input = JSON.parse(jsonVal)
    input.fhCompanyId = fhCompanyId;
    if(input.customer == true || input.customer == "true") {
      input.customer = 1;
    } else if (input.customer == false || input.customer == "false") {
      input.customer = 0;
    }
    const { OpportunityOwner } = await connectToDatabase()
    const connection = await connectToDatabase.getConnection()
    if (!input.fhCompanyId || !input.customerType)
      throw new HTTPError(422, `One or more required fields are missing`)
    await connection.query('INSERT INTO opportunity_owners (`fhCompanyId`, `email`, `firstName`, `middleName`, `lastName`, `supportEmail`, `customerType`, `phone`, `customer`, `createdAt`, `updatedAt`) \
                            values(' + '"'+input.fhCompanyId+'","'+input.email+'","'+input.firstName+'","'+input.middleName+'","'+input.lastName+'","'+input.supportEmail+'","'+input.customerType+'","'+input.phone+'","'+input.customer+'",' + '\
                            NOW(),NOW()) \
                            ON DUPLICATE KEY UPDATE  \
                            email = VALUES(email), \
                            firstName = VALUES(firstName), \
                            middleName = VALUES(middleName), \
                            lastName = VALUES(lastName), \
                            supportEmail = VALUES(supportEmail), \
                            customerType = VALUES(customerType), \
                            phone = VALUES(phone), \
                            customer = VALUES(customer), \
                            updatedAt = VALUES(updatedAt)', function (error, results, fields) {
                                                              if (error) {
                                                                  throw error;
                                                              }});
    return "SUCCESS"
  } catch (err) {
    console.log(err.message)
    return err
  }
}

module.exports.updateAccount = async (event) => {

    account = JSON.parse(event.body);

    await updateAccountInRDS(account);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true },
      body: 'OK'
    }
}

 async function updateAccountInRDS(account) {
  try {
    const { Account } = await connectToDatabase();
    const condition = {id: account.id};

    return Account 
              .findOne({where: condition})
              .then(function (foundItem) {
                if(!foundItem) {
                  return Account.create(account)
                              .then(function(item) { 
                                   return {'account': account, 'created': true}
                              });
                } else {

                  return Account.update(account, {where: condition})
                              .then(function(item) { 
                                        return {'account': account, 'created': false} 
                              });
                }

              })    
  } catch (err) {
    console.log(err.message)
    return err
  }
}

module.exports.accountById = async (event) => {

  var accountId = null;
  if(event && event.queryStringParameters && event.queryStringParameters.accountId) {
    accountId = event.queryStringParameters.accountId;
  }

  if (!accountId)
      throw new HTTPError(422, `One or more required fields are missing`)

  try {
    
    var json = await getAccountData(accountId);
    json = JSON.parse(json);

    if(json.errorCode === "OK") {
      await updateAccountInRDS(json);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(json)
    }
  } catch (err) {
      console.log(err);
      return await handleSAOpportunityIdsError(err);
  }
}

async function getAccountData(accountId) {
  try {
    let httpPromise = getAccountByIdPromise(accountId);
    let responseBody = await httpPromise;
    return responseBody;
  }
  catch(error) {
    console.log("Error :  " + error.message);
    throw error
  }
}

function getAccountByIdPromise(accountId) {
  return new Promise((resolve, reject) => {
    var restPath = "/superadmin/rest/account/accountById.ws?accountId=" + accountId;
    var user_name = process.env.NODE_ENV == 'dev' ? 'meltwater' : 'sanetsuite';
    var password = process.env.NODE_ENV == 'dev' ? 'password' : 'sanetsuite';
    var options = {
        host: process.env.SA_HOST,
        port: process.env.SA_PORT,
        path: restPath,
        method: "GET",
        headers: {
            "User" : user_name,
            "Password" : password,
            "Accept": "application/json"
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
    req.setTimeout(parseInt(process.env.SA_TIMEOUT,10),function() {
      reject(new HTTPError(500, `Something went wrong in SA`))
    })
    req.end();
  });
}


async function getAccountFromRDS (accountId) {
  const { Account } = await connectToDatabase()
  const accounts = await Account.findAll({
                                      where: {
                                        id: accountId
                                      }});
  var account = accounts[0];
  var result = {};
  
    result = {
                 "id":   account.id,
                 "name": account.name,
                 "parentAccountId": account.parentAccountId,
                 "primaryOwnerEmail": account.primaryOwnerEmail,
                 "primaryContactEmail": account.primaryContactEmail,
                 "customerNumber": account.customerNumber,
                 "customerNumberMnews":  account.customerNumberMnews,
                 "website": account.website,
                 "accountType": account.accountType,
                 "mainSector": account.mainSector,
                 "address": account.address,
                 "addressCountryName": account.addressCountryName,
                 "addressCountryCode": account.addressCountryCode,
                 "cityName": account.cityName,
                 "countrySubdivisionName": account.countrySubdivisionName,
                 "zipCode": account.zipCode,
                 "timezoneCode": account.timezoneCode,
                 "languageCode": account.languageCode,
                 "phone": account.phone,
                 "active": account.active,
                 "mrrUSD": account.mrrUSD,
                 "supportLevel": account.supportLevel,
                 "earliestActiveSubscriptionEndDate": account.earliestActiveSubscriptionEndDate ,
                 "errorMessage": "",
                 "errorCode": "OK"
               }
  
  return result
}

// Update AWS DB,to be used by OEC
module.exports.updateOpportunityOwnerByOEC = async (event) => {
  try {
    const input = JSON.parse(event.body)
    const { OpportunityOwner } = await connectToDatabase()
    const connection = await connectToDatabase.getConnection()
    if (!input.fhCompanyId || !input.opportunityId || !input.customerType)
      throw new HTTPError(422, `One or more required fields are missing`)
    if (!input.firstName) {
    	input.firstName = '';
    }
    if (!input.middleName) {
    	input.middleName = '';
    }
    if (!input.lastName) {
    	input.lastName = '';
    }
    if (!input.email) {
    	input.email = '';
    }
    if (!input.supportEmail) {
    	input.supportEmail = '';
    }
    if (!input.phone) {
    	input.phone = '';
    }
    if (!input.includeOpp) {
      input.includeOpp = '1';
    }
    await connection.query('INSERT INTO opportunity_owners (`fhCompanyId`, `email`, `firstName`, `middleName`, `lastName`, `supportEmail`, `customerType`, `phone`, `customer`, `opportunityId`, `createdAt`, `updatedAt`) \
                            values(' + '"'+input.fhCompanyId+'","'+input.email+'","'+input.firstName+'","'+input.middleName+'","'+input.lastName+'","'+input.supportEmail+'","'+input.customerType+'","'+input.phone+'","'+input.customer+'","'+input.opportunityId+'",' + '\
                            NOW(),NOW()) \
                            ON DUPLICATE KEY UPDATE  \
                            email = VALUES(email), \
                            firstName = VALUES(firstName), \
                            middleName = VALUES(middleName), \
                            lastName = VALUES(lastName), \
                            supportEmail = VALUES(supportEmail), \
                            customerType = VALUES(customerType), \
                            phone = VALUES(phone), \
                            customer = VALUES(customer), \
                            opportunityId = VALUES(opportunityId), \
                            updatedAt = VALUES(updatedAt)', function (error, results, fields) {
                                                              if (error) {
                                                                  throw error;
                                                              }});

    await connection.query('delete from owner_opportunity_ids where opportunityId = "' + input.opportunityId + '"');
    if(input.email != null && input.email != '') {
      const opportunityOwner = await OpportunityOwner.findAll({
                                            where: {
                                              email: input.email
                                            }})
      await connection.query('delete from owner_opportunity_ids where email = "' + input.email + '"');

      for(var index = 0; index < opportunityOwner.length; index++) {
        var oppOwner = opportunityOwner[index];
        if(input.includeOpp == 1 || input.includeOpp == "1") {
          await connection.query('INSERT INTO owner_opportunity_ids (`email`, `opportunityId`, `createdAt`, `updatedAt`) \
                                    values(' + '"'+oppOwner.email+'","'+oppOwner.opportunityId+'",'+ '\
                                    NOW(),NOW())', function (error, results, fields) {
                                                                      if (error) {
                                                                          throw error;
                                                                      }});
        }
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify("SUCCESS")
    }
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(err) || 'Could not update the OpportunityOwner.'
    }
  }
}
