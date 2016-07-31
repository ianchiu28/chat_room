function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

// 處理原始的使用者輸入
function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	
	if(message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if(systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message); // 將非聊天命令的輸入廣播給其它使用者
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	
	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	socket.on('nameResult', function(result) { // 展示暱稱變更意圖的結果
		var message;
		
		if(result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	socket.on('joinResult', function(result) { // 展示聊天室變更的結果
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});
	
	socket.on('message', function(message) { // 展示收到的訊息
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});
	
	socket.on('rooms', function(rooms) { // 展示有效聊天室的清單
		$('#room-list').empty();
	
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		
		$('#room-list div').click(function() { // 允許點擊聊天室名稱而切換到該聊天室
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});
	
	setInterval(function() { // 間歇地請求有效聊天室清單
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	$('#send-form').submit(function() { // 允許提交表單，傳送聊天訊息
		processUserInput(chatApp, socket);
		return false;
	});
});