'use strict';
var express = require('express');
var app = express();
var neo4jHelper = require('./neo4jHelper.js');
var bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // loading of swagger docs
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res, next) {
    res.redirect('/api-docs');
});

app.post('/addConnection', function (req, res, next) {
    var jsonResponse = {
        connectionMade: [],
        connectionExist: []
    };

    if (typeof req.body.friends === 'undefined') {
        res.status(400);
        jsonResponse.message = "Please provide an email address";
        jsonResponse.success = false;
        jsonResponse.code = 4;
        return res.send(jsonResponse);
    }

    var friends = req.body.friends;
    if (friends.length < 2) {
        res.status(400);
        jsonResponse.success = false;
        jsonResponse.message = "A connection takes two. Please provide 2 email addresses :)";
        jsonResponse.code = 3;
        return res.json(jsonResponse)
    }

    neo4jHelper.findRelation(function (err, records, userEmail, followerEmail, jsonResponse) {
        if (err) return dbConnectionError(err, res);
        // when connection dosen't exist
        if (records.length === 0) {
            neo4jHelper.findBlockConnection(function (err, records, userEmail, followerEmail, jsonResponse) {
                if (err) return dbConnectionError(err, res);
                // connects are ok to be added
                if (records.length === 0) {
                    neo4jHelper.createConnection(function (err, node) {
                        if (err) return dbConnectionError(err, res);
                        jsonResponse.connectionMade.push([userEmail, followerEmail]);
                        jsonResponse.success = true;
                        jsonResponse.message = "Connections Created";
                        jsonResponse.code = 0;
                        return res.json(jsonResponse)
                    }, userEmail, followerEmail, jsonResponse)
                }
                else {
                    jsonResponse.success = false;
                    jsonResponse.message = "Connects cannot be added for block contacts";
                    jsonResponse.code = 5;
                    return res.json(jsonResponse)
                }
            }, userEmail, followerEmail, jsonResponse)

        }
        // when connection exist
        else if (records.length > 0) {
            jsonResponse.connectionExist.push([userEmail, followerEmail]);
            jsonResponse.success = true;
            jsonResponse.message = "Connections Exist";
            jsonResponse.code = 0;
            return res.json(jsonResponse)
        }
    }, friends[0], friends[1], jsonResponse)
})

app.post('/getFriendList', function (req, res, next) {
    if (typeof req.body.email === 'undefined' || req.body.email === '') {
        res.status(400);
        var jsonResponse = {};
        jsonResponse.message = "Please provide an email address";
        jsonResponse.success = false;
        jsonResponse.code = 4;
        return res.send(jsonResponse);
    }

    var email = req.body.email;
    neo4jHelper.findFollowNode(function (err, records) {
        if (err) return dbConnectionError(err, res);
        var jsonResponse = {
            friends: [],
            count: 0
        };
        if (records.length > 0) {
            jsonResponse.count = records.length;

            var friends = [];
            records.map(record => { // Iterate through records
                friends.push(record.get("email"));
                // console.log( record._fields ); // Access the name property from the RETURN statement
            });
            jsonResponse.friends = friends;
            jsonResponse.message = "Here are all your friends";
            jsonResponse.code = 0;
        }
        else {
            jsonResponse.message = "It seems like you have no friends :(";
            jsonResponse.code = 0;
        }

        jsonResponse.success = true;
        return res.send(jsonResponse);
    }, email)
})

app.post('/getCommonFriendList', function (req, res, next) {
    if (typeof req.body.friends === 'undefined') {
        res.status(400);
        var jsonResponse = {};
        jsonResponse.message = "Please provide an email address.";
        jsonResponse.success = false;
        jsonResponse.code = 4;
        return res.send(jsonResponse);
    }
    else if (req.body.friends.length < 2) {
        res.status(400);
        var jsonResponse = {};
        jsonResponse.message = "Need one more emaill address to find common friends.";
        jsonResponse.success = false;
        jsonResponse.code = 3;
        return res.send(jsonResponse);
    }

    var friends = req.body.friends;
    neo4jHelper.findCommonNode(function (err, records) {
        if (err) return dbConnectionError(err, res);
        var jsonResponse = {
            friends: [],
            count: 0
        };
        if (records.length > 0) {
            jsonResponse.count = records.length;

            var friends = [];
            records.map(record => { // Iterate through records
                friends.push(record.get("email"));
                // console.log( record._fields ); // Access the name property from the RETURN statement
            });
            jsonResponse.friends = friends;
            jsonResponse.message = "Here are all your friends";
            jsonResponse.code = 0;
        }
        else {
            jsonResponse.message = "It seems like you have no common friends :(";
            jsonResponse.code = 0;
        }

        jsonResponse.success = true;
        return res.send(jsonResponse);
    }, friends[0], friends[1])
})

app.post('/addSubscription', function (req, res, next) {
    var jsonResponse = {
        subscriptionMade: [],
        subscriptionExist: []
    };

    if (typeof req.body.requestor === 'undefined' || req.body.requestor === '' ||
        typeof req.body.target === 'undefined' || typeof req.body.target === '') {
        res.status(400);
        jsonResponse.message = "Target/Requestor field is missing or empty.";
        jsonResponse.success = false;
        jsonResponse.code = 4;
        return res.send(jsonResponse);
    }

    var requestor = req.body.requestor;
    var target = req.body.target;

    neo4jHelper.findSubscription(function (err, records, requestor, target, jsonResponse) {
        if (err) return dbConnectionError(err, res);
        // when connection dosen't exist
        if (records.length === 0) {
            neo4jHelper.createSubscription(function (err, node) {
                if (err) return dbConnectionError(err, res);
                jsonResponse.subscriptionMade.push([requestor, target]);
                jsonResponse.success = true;
                jsonResponse.message = "Connections Created";
                jsonResponse.code = 0;
                return res.json(jsonResponse)
            }, requestor, target, jsonResponse)
        }
        // when connection exist
        else if (records.length > 0) {
            jsonResponse.subscriptionExist.push([requestor, target]);
            jsonResponse.success = true;
            jsonResponse.message = "Connections Exist";
            jsonResponse.code = 0;
            return res.json(jsonResponse)
        }
    }, requestor, target, jsonResponse)
})

app.post('/blockConnection', function (req, res, next) {
    var jsonResponse = {
        blocksMade: [],
        blocksExist: []
    };

    if (typeof req.body.requestor === 'undefined' || req.body.requestor === '' ||
        typeof req.body.target === 'undefined' || typeof req.body.target === '') {
        res.status(400);
        jsonResponse.message = "Target/Requestor field is missing or empty.";
        jsonResponse.success = false;
        jsonResponse.code = 4;
        return res.send(jsonResponse);
    }

    var requestor = req.body.requestor;
    var target = req.body.target;

    neo4jHelper.findBlockConnection(function (err, records, requestor, target, jsonResponse) {
        if (err) return next(err);
        // when connection dosen't exist
        if (records.length === 0) {
            neo4jHelper.createBlockConnection(function (err, node) {
                if (err) return dbConnectionError(err, res);
                jsonResponse.blocksMade.push([requestor, target]);
                jsonResponse.success = true;
                jsonResponse.message = "Connections Created";
                jsonResponse.code = 0;
                return res.json(jsonResponse)
            }, requestor, target, jsonResponse)
        }
        // when connection exist
        else if (records.length > 0) {
            jsonResponse.blocksExist.push([requestor, target]);
            jsonResponse.success = true;
            jsonResponse.message = "Connections Exist";
            jsonResponse.code = 0;
            return res.json(jsonResponse)
        }
    }, requestor, target, jsonResponse)
})

app.get('/tools/drop', function (req, res, next) {
    neo4jHelper.dropDb(function (err, result) {
        if (err) return next(err);
        res.json(result);
    });
});

function dbConnectionError(err, res) {
    res.status(400);
    if (err.code === 'ServiceUnavailable') {
        jsonResponse.message = "Our hamsters powering the site is currently taking a break. Please try again later.";
        jsonResponse.code = 2;
    }
    else {
        jsonResponse.message = "It seems that Bill has forgotten to pay our power bill. Please try again in awhile.";
        jsonResponse.code = 1;
    }
    jsonResponse.success = false;
    return res.json(jsonResponse)
}

app.use(function (req, res, next) {
    res.redirect('/api-docs');
});


app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({ "success": false, "message": "Uh-oh, Something terrible has went wrong!", "code": -1 });
});

// Use middleware to set the default Content-Type
app.use(function (req, res, next) {
    res.header('Content-Type', 'application/json');
    next();
});

app.listen(8080, function () {
    console.log('started');
});

module.exports = app