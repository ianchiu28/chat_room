function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

// �B�z��l���ϥΪ̿�J
function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	
	if(message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if(systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message); // �N�D��ѩR�O����J�s�����䥦�ϥΪ�
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	
	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	socket.on('nameResult', function(result) { // �i�ܼʺ��ܧ�N�Ϫ����G
		var message;
		
		if(result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	socket.on('joinResult', function(result) { // �i�ܲ�ѫ��ܧ󪺵��G
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});
	
	socket.on('message', function(message) { // �i�ܦ��쪺�T��
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});
	
	socket.on('rooms', function(rooms) { // �i�ܦ��Ĳ�ѫǪ��M��
		$('#room-list').empty();
	
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		
		$('#room-list div').click(function() { // ���\�I����ѫǦW�٦Ӥ�����Ӳ�ѫ�
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});
	
	setInterval(function() { // �����a�ШD���Ĳ�ѫǲM��
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	$('#send-form').submit(function() { // ���\������A�ǰe��ѰT��
		processUserInput(chatApp, socket);
		return false;
	});
});