/* Build 4 */

var server = require('http').createServer(onRequest);
var io = require('socket.io').listen(server);
var url = require("url");
var fs = require('fs');
var mime = require('mime');


// HTTP Request

function onRequest(request, response) {
	
	var path = url.parse(request.url).pathname;

	route(path, response);

}


// HTTP Router

function route(path, response) {

	var fsPath = __dirname + "/public/" + path;

	fs.exists(fsPath, function (exists) {
			
		if (exists) {
			
			fs.stat(fsPath, function (err, stats) {
				
				if (err) throw err;
				if (stats.isDirectory()) fsPath += "/index.html";
				
				fs.readFile(fsPath, function (err, data) {

					if (err) throw err;

					response.writeHead(200, {"Content-Type": mime.lookup(fsPath) });
					response.end(data);

				});
				
			});
			
		}
			
		else {
		
			fs.readFile(__dirname + "/public/chat/index.html", function (err, data) {
		
				if (err) throw err;
		
				response.writeHead(200, {"Content-Type": "text/html"});
				response.end(data);
		
			});
			
		}
			
  	});
	
}


// socket.io Server

io.sockets.on('connection', function (socket) {
	
	socket.on('newMessage', function (data) {
		
		var path = data.path;
		
		io.sockets.in(path).emit('newMessage', data);
		messages.save(data, path);
		
	});
	
	socket.on('updateUsers', function (data) {
	
		var path = data.path;
		
		if (users[path] == null) users[path] = new Room();
		
		users[path].update(socket, data, path);
 
	});
	
});


// users

var users = {};


// Room

function Room() {

	this.lastRemove = new Date().getTime();
	this.data = {};
	
	this.update = function (socket, user, path) {
	
		var changed = false;
		var joining = false;
	
		// save
		if (this.data[user.userID] == null) changed = true, joining = true;
		else if (this.data[user.userID].name != user.name) changed = true;
		
		user.unixTime = new Date().getTime();
		this.data[user.userID] = user;
	
		// remove
		if (new Date().getTime() - this.lastRemove >= 5*1000) {
			
			for (var user in this.data) {
				if (new Date().getTime() - this.data[user].unixTime >= 10*1000) {
					delete this.data[user];
					changed = true;
				}
			}
		
			this.lastRemove = new Date().getTime();
			
		}
	
		if (changed) {
			io.sockets.in(path).emit('updatedUsers', this.data);
		}
	
		if (joining) { /* if the user is new */
	
			socket.join(path);
			socket.emit('updatedUsers', this.data);
			messages.read(path, function (messages) {
				
				if (messages != false) {

					var items = Object.keys(messages).length;
					
					for (var number in messages) {
		 				if (parseInt(number) < items - 100) delete messages[number];
		 			}
		 			
		 			socket.emit('archivedMessages', messages);
		 		
		 		}

		 	});
	
		}
	
	}
	
}


// messages

var messages = {};

messages.file = __dirname + '/messages.json';

messages.check = function () {

	fs.readFile(messages.file, function (err, data) {
	
		if (err) throw err;
		
		if (data == '') {
		
			fs.writeFile(messages.file, "{}", function (err) {
				if (err) throw err;
				console.log(messages.file + " was invalid, content was set to default.");
			});
		
		}
	
		else console.log(messages.file + "'s data is valid");
		
	});

}

messages.read = function (path, callback) {
	
	fs.readFile(messages.file, function (err, data) {
	
		if (err) throw err;
		data = JSON.parse(data);
		
		if (data[path] == null) var messages = false;
		else var messages = data[path].messages;
		
		callback(messages);
		
	});
	
}

messages.save = function (message, path) {
	
	fs.readFile(messages.file, function (err, data) {
	
		if (err) throw err;
		data = JSON.parse(data);
		
		if (data[path] == null) {
			data[path] = {};
			data[path].messages = {};
		}
			  	
		data[path].messages[Object.keys(data[path].messages).length] = message;
			  	
		fs.writeFile(messages.file, JSON.stringify(data), function (err) {
			if (err) throw err;
		});
		
	});
	
}


// Start

messages.check();
server.listen(9001);
console.log("Server has started.");
