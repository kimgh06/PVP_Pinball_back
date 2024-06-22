import http from "http";
import { WebSocketServer } from "ws";
import express from "express";

const app = express();
const port = 8888;

const maxMapX = 100, maxMapY = 100;
let clientA, clientB;
let mapA, mapB;
// let 

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  console.log(socket);

  // 이벤트
  socket.on("close", () => {
    if (socket === clientA) {
      clientA = null;
    }
    else if (socket === clientB) {
      clientB = null;
    }
  });

  socket.on("message", (message) => {
    console.log("클라이언트로 부터의 메시지 : " + message);
  });

  socket.send('Connected');
  if (!clientA) {
    clientA = socket;
    console.log('a');
  }
  else if (!clientB) {
    clientB = socket;
    console.log('b');
  }
  else {
    socket.send("full");
    socket.close();
  }
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});