// 這段程式碼由JavaScript的類別(Class)等價物開始，它在被實例化時接受單一引數Socket.IO socket
var Chat = function(socket) {
	this.socket = socket;
};

// 傳送聊天訊息
Chat.prototype.sendMessage = function(room, text) {
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

// 變更聊天室
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	});
};

// 處理聊天命令
Chat.prototype.processCommand = function(command) {
	var words = command.split(' ');
	var command = words[0].substring(1, words[0].length).toLowerCase(); // 從第一個單字解析命令
	var message = false;
	
	switch(command) {
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room); // 處裡聊天室變更/建立
			break;
			
		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name); // 處理暱稱變更的企圖
			break;
			
		default:
			message = 'Unrecognized command.';
			break;
	}
	
	return message;
};