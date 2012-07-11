var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var http = require('http');
var mongo = require('mongodb'),
	Server = mongo.Server,
	Db = mongo.Db;


var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('exampleDb', server);

db.open(function(err, db){
	if (err) {
		return console.error("Error connecting to database: ", err);
	}
	else {
		setupCollections(db);
	}
});


function setupCollections(db) {
    db.collection('test', function(err, collection) {
		if (err) {
			return console.error(err);
		}
		collection.remove();
		collection.ensureIndex('hello', {safe: true, unique:true, dropDups:true}, function(err, indexName){
			console.log("Created index: " + indexName)
			testInserts(collection)
		});
		collection.indexInformation(function(err, info){
			if (err){
				return console.log('Error: indexInformation: ', err);
			}
			console.log('Collection\'s Index info: ', info)
		})
	})
		
}

function testInserts(collection){
	var doc1 = {'hello':'doc1'};
	var doc2 = {'hello':'doc2'};
	var lotsOfDocs = [{'hello':'doc3'}, {'hello':'doc4'}];

	collection.insert(doc1);

	collection.insert(doc2, {safe:true}, function(err, result) {console.log("Insert doc2: ", err, result);});

	collection.insert(lotsOfDocs, {safe:true}, function(err, result) {console.log("Insert doc array", err, result);});
	
	collection.insert({hello: 'doc2', dupe: 'yes'}, {safe: true}, function(err, result){
		console.log("Dup Insert result: ", err, result);
	});

	collection.update({'hello': 'doc3'}, {$set: {title: 'Document Three'}}, {safe:true}, function(err, result){
		console.log("Update result: ", err, result);
		if (result === 1) {
			
			collection.find({hello: 'doc2'}, {explain:true}).toArray(function(err, items){
				console.log("Array results")
				console.log(items);
			});
			
			var stream = collection.find({hello:{$ne:'doc2'}}).streamRecords();
			var first = true;
			stream.on("data", function(item) {
				var intro = 'Packet: ';
				if (first) {
					intro = "Stream results";
					first = false;
				}
				console.log(intro, item)
			});
			stream.on("end", function() {});
			
			
			
		}
	})
}



http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Ian\n');
}).listen(port, host);
