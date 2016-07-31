var http = require('http'); // 內建http模組提供HTTP伺服器與客戶端的功能性
var fs = require('fs');
var path = require('path'); // 內建path模組提供檔案系統路徑相關的功能性
var mime = require('mime'); // mime模組附加元件讓你根據檔案副檔名取得MIME類型
var cache = {}; // cache物件是快取檔案內容的地方

// 請求的檔案不存在時傳送404錯誤
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

// 寫出適當的HTTP標頭，再傳送檔案內容
function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200,
		{"content-type": mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}

// 決定檔案是否被快取，是的話就提供它；不是的話，就從磁碟讀取，再提供它
// 假如檔案不存在，傳回HTTP 404錯誤
function serveStatic(response, cache, absPath) {
	if(cache[absPath]) { // 檢查檔案是否被快取在記憶體
		sendFile(response, absPath, cache[absPath]); // 從記憶體提供檔案
	} else {
		fs.exists(absPath, function(exists) { // 檢查檔案是否存在
			if(exists) {
				fs.readFile(absPath, function(err, data) { // 從磁碟讀取檔案
					if(err) {
						send404(response); // 404 error
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data); // 提供從磁碟讀取的檔案
					}
				});
			} else {
				send404(response); // 404 error
			}
		});
	}
}

// 建立HTTP伺服器，使用匿名函式定義針對每個請求所產生的行為
var server = http.createServer(function(request, response) {
	var filePath = false;
	
	if(request.url == '/') {
		filePath = 'public/index.html'; // 決定預設提供的HTML檔案
	} else {
		filePath = 'public' + request.url; // 將URL路徑轉換為相對檔案路徑
	}
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath); // 提供靜態檔案
});

// 啟動伺服器，並且在TCP/IP埠口3000上進行偵聽 (3000可以任選1024以上的數字)
server.listen(3000, function() {
	console.log("Server listening on port 3000.");
});

// 建立Socket.IO伺服器
var chatServer = require('./lib/chat_server');
chatServer.listen(server); // 啟動伺服器