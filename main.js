import express from 'express';
import process from 'process';
import path from 'path';
const app = express();

import WebSocket, * as WS from 'ws';

const wss = new WS.WebSocketServer({port: 3000});

const clients = new Map();

wss.on("connection", function wsConnection(ws) {
	ws.once("message", function wsInitialMessage(message) {
		message = message.toString();
		console.log(`new connection: ${JSON.parse(message).user}`);
		wss.clients.forEach(con => {
			con.send(message);
		});
		clients.set(ws, JSON.parse(message));

		ws.on("message", wsMessage);
		function wsMessage(msg) {
			msg = msg.toString();
			wss.clients.forEach(con => {
				con.send(msg);
			});
			msg = JSON.parse(msg);
			console.log(`[${msg.author}]: ${msg.content}`);
		}

		ws.on("close", function wsClose(code, reason) {
			let data = clients.get(ws);
			clients.delete(ws);
			console.log(`Connection with ${data.user} closed: ${reason.toString()}`);
			clients.forEach((undefined, socket) => {
				socket.send(JSON.stringify({type: "disconnect", user: data.user}));
			});
		});
	});
});

const web_port = parseInt(process.env?.IRC_WEBCHAT_PORT);

app.listen(isNaN(web_port) ? 80 : web_port, () => {
	console.log("Successfully started meta-IRC page.");
});

app.get("/", (req, res) => {
	res.sendFile(path.join(process.cwd(), "pages", "index.html"));
});
