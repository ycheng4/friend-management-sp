var expect = require('chai').expect;
var neo4jHelper = require('../neo4jHelper.js');

describe('neo4jFunc Test', function () {
	before(function (done) {
		// run incase after case failed
		neo4jHelper.dropDb(function (err, result) {
			if (err) return err;
			done();
		});
	});
	
	describe('findRelation()', function () {
		var userEmail = "youjun89@gmail.com";
		var followerEmail = "youjun9@gmail.com";

		before(function (done) {
			// run incase after case failed
			neo4jHelper.createRelation(function (err, node) {
				done();
			}, userEmail, followerEmail)
		});

		it('find relation between 2 nodes exist', function (done) {
			neo4jHelper.findRelation(function (err, records) {
				if (err) {
					return err;
				};
				expect(records).to.have.length.above(0);
				done();
			}, userEmail, followerEmail)
		});
	});
});