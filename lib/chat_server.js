var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// 啟用Socket.IO伺服器
exports.listen = function(server) {
	io = socketio.listen(server); // 啟動Socket.IO伺服器，讓他奠基於既有的HTTP伺服器上
	io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) { // 定義每個使用者連接將如何被處理
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); // 使用者連接時，為它指定訪客暱稱
		joinRoom(socket, 'Lobby'); // 使用者連接時，將他放進Lobby聊天室
		
		handleMessageBroadcasting(socket, nickNames); // 處理使用者訊息
		handleNameChangeAttempts(socket, nickNames, namesUsed); // 暱稱改變
		handleRoomJoining(socket); // 聊天室建立/變更
		socket.on('rooms', function() { // 提供使用者聊天室清單
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		
		handleClientDisconnection(socket, nickNames, namesUsed); // 定義使用者斷現時的清理邏輯
	});
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guest' + guestNumber; // 產生新的訪客暱稱
	nickNames[socket.id] = name; // 將訪客暱稱與客戶端連接ID關連起來
	socket.emit('nameResult', { // 讓使用者知道他的訪客暱稱
		success: true,
		name: name
	});
	namesUsed.push(name); // 指名這個訪客暱稱目前被使用中
	return  guestNumber + 1; // 遞增用來產生訪客暱稱的計數器
}

function joinRoom(socket, room) {
	socket.join(room); // 讓使用者加入聊天室
	currentRoom[socket.id] = room; // 註明使用者現在正在這個聊天室裡
	socket.emit('joinResult', {room: room}); // 讓使用者知道他現在正在新聊天室裡
	socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + ' has joined ' + room + '.'}); // 讓聊天室裡的其它使用者知道使用者已經加入
	
	var usersInRoom = io.sockets.clients(room); // 判斷有哪些人跟使用者在相同聊天室
	if (usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id) {
				if( index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message', {text: usersInRoomSummary}); // 告訴使用者還有哪些人處於相同聊天室
	}
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) { // 增加nameAttempt事件的偵聽器
		if(name.indexOf('Guest') == 0) { // 新的使用者暱稱不允許以Guest作為開頭
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			if(namesUsed.indexOf(name) == -1) { // 如果暱稱尚未被註冊，就註冊它
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + ' is now known as ' + name + '.'
				});
			} else { // 如果暱稱已經被註冊，傳送錯誤訊息
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}