'use strict';
const neo4j = require('neo4j-driver').v1;
const driver = neo4j.driver("bolt://neo4j:7687", neo4j.auth.basic("neo4j", "neo4jsp"));
// const driver = neo4j.driver("bolt://localhost:17687", neo4j.auth.basic("neo4j", "neo4jsp"));

/**
 * ServiceUnavailable - neo4j not up yet
 * Neo.ClientError.Schema.ConstraintValidationFailed - already have link
 */
var neo4jHelper = {
    insertNode: function (callback, node) {
        const session = driver.session();
        const resultPromise = session.run(
            'MERGE (a:Person {name:{name},sex:{sex}}) ON CREATE SET a.name={name}, a.sex={sex} return a',
            node
        );

        resultPromise.then(result => {
            session.close();
            const singleRecord = result.records[0];
            const node = singleRecord.get(0);
            // on application exit:
            driver.close();
            callback(null, node.properties);
        }).catch(function (error) {
            callback(error, null);
        });
    },

    findFollowNode: function (callback, userEmail) {
        var query = "Match (a:Person)-[:CONNECT]-(b:Person) where a.email={userEmailParam} RETURN b.email as email";
        const session = driver.session();
        const resultPromise = session.run(query, { userEmailParam: userEmail });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records);
        }).catch(function (error) {
            callback(error, null);
        });
    },

    createConnection: function (callback, userEmail, followerEmail) {
        var query = "MERGE (a:Person {email:{userEmailParam}}) ON CREATE SET a.email={userEmailParam}";
        query+="MERGE (b:Person {email:{followerEmailParam}}) ON CREATE SET b.email={followerEmailParam}";
        query+="MERGE (a)-[:CONNECT]-(b)";

        const session = driver.session();
        const resultPromise = session.run(query, { userEmailParam: userEmail, followerEmailParam: followerEmail });
        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, "success");
        }).catch(function (error) {
            callback(error, null);
        });
    },

    createSubscription: function (callback, requestor, target) {
        var query = "MERGE (a:Person {email:{requestorParam}}) ON CREATE SET a.email={requestorParam}";
        query+="MERGE (b:Person {email:{targetParam}}) ON CREATE SET b.email={targetParam}";
        query+="MERGE (a)-[:SUBSCRIBE]->(b)";

        const session = driver.session();
        const resultPromise = session.run(query, { requestorParam: requestor, targetParam: target });
        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, "success");
        }).catch(function (error) {
            callback(error, null);
        });
    },

    createBlockConnection: function (callback, requestor, target) {
        var query = "MERGE (a:Person {email:{requestorParam}}) ON CREATE SET a.email={requestorParam}";
        query+="MERGE (b:Person {email:{targetParam}}) ON CREATE SET b.email={targetParam}";
        query+="MERGE (a)-[:BLOCKS]->(b)";

        const session = driver.session();
        const resultPromise = session.run(query, { requestorParam: requestor, targetParam: target });
        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, "success");
        }).catch(function (error) {
            callback(error, null);
        });
    },

    findRelation: function (callback, userEmail, followerEmail, jsonResponse) {
        var query = "Match (a:Person) where a.email={userEmailParam} ";
        query += "Match (b:Person) where b.email={followerEmailParam} ";
        query += "Match (a)-[:CONNECT]-(b) return a,b";

        const session = driver.session();
        const resultPromise = session.run(query, { userEmailParam: userEmail, followerEmailParam: followerEmail });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, userEmail, followerEmail, jsonResponse);
        }).catch(function (error) {
            callback(error, null,userEmail,followerEmail,jsonResponse);
        });
    },

    findCommonNode: function (callback, userEmail, userEmail2) {
        var query = "Match (a:Person)-[:CONNECT]-(b:Person)-[:CONNECT]-(c:Person) ";
        query += "where a.email= {userEmailParam} and c.email={userEmail2Param} return b.email as email"

        const session = driver.session();
        const resultPromise = session.run(query, { userEmailParam: userEmail, userEmail2Param: userEmail2 });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records);
        }).catch(function (error) {
            callback(error, null);
        });
    },

    findSubscription: function (callback, requestor, target, jsonResponse) {
        var query = "Match (a:Person) where a.email={requestorParam} ";
        query += "Match (b:Person) where b.email={targetParam} ";
        query += "Match (a)-[:SUBSCRIBE]->(b) return a,b";

        const session = driver.session();
        const resultPromise = session.run(query, { requestorParam: requestor, targetParam: target });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, requestor, target, jsonResponse);
        }).catch(function (error) {
            callback(error, null,requestor,target,jsonResponse);
        });
    },

    findBlockConnection: function (callback, requestor, target, jsonResponse) {
        var query = "Match (a:Person) where a.email={requestorParam} ";
        query += "Match (b:Person) where b.email={targetParam} ";
        query += "Match (a)-[:BLOCKS]->(b) return a,b";

        const session = driver.session();
        const resultPromise = session.run(query, { requestorParam: requestor, targetParam: target });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, requestor, target, jsonResponse);
        }).catch(function (error) {
            callback(error, null,requestor,target,jsonResponse);
        });
    },

    findUpdateEmailList: function (callback, requestor, target, jsonResponse) {
        var query = "Match (a:Person) where a.email={requestorParam} ";
        query += "Match (b:Person) where b.email={targetParam} ";
        query += "Match (a)-[:BLOCKS]->(b) return a,b";

        const session = driver.session();
        const resultPromise = session.run(query, { requestorParam: requestor, targetParam: target });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, requestor, target, jsonResponse);
        }).catch(function (error) {
            callback(error, null,requestor,target,jsonResponse);
        });
    },

    findUnblockConnectionByList: function (callback, email, targetList, jsonResponse) {
        var query = "WITH {targetListParam} as emailList ";
        query += "Match (b:Person) where b.email={emailParam} ";
        query += "Match (a:Person) where a.email in emailList and NOT (a)-[:BLOCKS]-(b) ";
        query += "Return DISTINCT a.email as email";

        const session = driver.session();
        const resultPromise = session.run(query, { emailParam: email, targetListParam: targetList });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, jsonResponse);
        }).catch(function (error) {
            callback(error, null,jsonResponse);
        });
    },

    findConnectOrSubscriptioneNodes: function (callback, email, jsonResponse) {
        var query = "Match (b:Person)-[:CONNECT]-(a:Person) WHERE a.email={emailParam} RETURN b.email as email ";
        query += "UNION ";
        query += "Match (b:Person)-[:SUBSCRIBE]->(a:Person) WHERE a.email={emailParam} Return DISTINCT b.email as email";

        const session = driver.session();
        const resultPromise = session.run(query, { emailParam: email });

        resultPromise.then(result => {
            session.close();
            // on application exit:
            driver.close();
            callback(null, result.records, jsonResponse);
        }).catch(function (error) {
            callback(error, null,jsonResponse);
        });
    },

    dropDb: function (callback) {
        const session = driver.session();
        const resultPromise = session.run(
            'MATCH (n) DETACH DELETE n'
        );

        resultPromise.then(result => {
            session.close();
            driver.close();
            callback(null, result);
        }).catch(function (error) {
            callback(error, null);
        });
    }
}

module.exports = neo4jHelper;