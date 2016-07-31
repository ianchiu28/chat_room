// �o�q�{���X��JavaScript�����O(Class)�������}�l�A���b�Q��ҤƮɱ�����@�޼�Socket.IO socket
var Chat = function(socket) {
	this.socket = socket;
};

// �ǰe��ѰT��
Chat.prototype.sendMessage = function(room, text) {
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

// �ܧ��ѫ�
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	});
};

// �B�z��ѩR�O
Chat.prototype.processCommand = function(command) {
	var words = command.split(' ');
	var command = words[0].substring(1, words[0].length).toLowerCase(); // �q�Ĥ@�ӳ�r�ѪR�R�O
	var message = false;
	
	switch(command) {
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room); // �B�̲�ѫ��ܧ�/�إ�
			break;
			
		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name); // �B�z�ʺ��ܧ󪺥���
			break;
			
		default:
			message = 'Unrecognized command.';
			break;
	}
	
	return message;
};