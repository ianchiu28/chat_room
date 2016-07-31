var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// �ҥ�Socket.IO���A��
exports.listen = function(server) {
	io = socketio.listen(server); // �Ұ�Socket.IO���A���A���L�����J����HTTP���A���W
	io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) { // �w�q�C�ӨϥΪ̳s���N�p��Q�B�z
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); // �ϥΪ̳s���ɡA�������w�X�ȼʺ�
		joinRoom(socket, 'Lobby'); // �ϥΪ̳s���ɡA�N�L��iLobby��ѫ�
		
		handleMessageBroadcasting(socket, nickNames); // �B�z�ϥΪ̰T��
		handleNameChangeAttempts(socket, nickNames, namesUsed); // �ʺ٧���
		handleRoomJoining(socket); // ��ѫǫإ�/�ܧ�
		socket.on('rooms', function() { // ���ѨϥΪ̲�ѫǲM��
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		
		handleClientDisconnection(socket, nickNames, namesUsed); // �w�q�ϥΪ��_�{�ɪ��M�z�޿�
	});
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guest' + guestNumber; // ���ͷs���X�ȼʺ�
	nickNames[socket.id] = name; // �N�X�ȼʺٻP�Ȥ�ݳs��ID���s�_��
	socket.emit('nameResult', { // ���ϥΪ̪��D�L���X�ȼʺ�
		success: true,
		name: name
	});
	namesUsed.push(name); // ���W�o�ӳX�ȼʺ٥ثe�Q�ϥΤ�
	return  guestNumber + 1; // ���W�ΨӲ��ͳX�ȼʺ٪��p�ƾ�
}

function joinRoom(socket, room) {
	socket.join(room); // ���ϥΪ̥[�J��ѫ�
	currentRoom[socket.id] = room; // �����ϥΪ̲{�b���b�o�Ӳ�ѫǸ�
	socket.emit('joinResult', {room: room}); // ���ϥΪ̪��D�L�{�b���b�s��ѫǸ�
	socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + ' has joined ' + room + '.'}); // ����ѫǸ̪��䥦�ϥΪ̪��D�ϥΪ̤w�g�[�J
	
	var usersInRoom = io.sockets.clients(room); // �P�_�����ǤH��ϥΪ̦b�ۦP��ѫ�
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
		socket.emit('message', {text: usersInRoomSummary}); // �i�D�ϥΪ��٦����ǤH�B��ۦP��ѫ�
	}
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) { // �W�[nameAttempt�ƥ󪺰�ť��
		if(name.indexOf('Guest') == 0) { // �s���ϥΪ̼ʺ٤����\�HGuest�@���}�Y
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			if(namesUsed.indexOf(name) == -1) { // �p�G�ʺ٩|���Q���U�A�N���U��
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
			} else { // �p�G�ʺ٤w�g�Q���U�A�ǰe���~�T��
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