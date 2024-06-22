import http from "http";
import wait from 'waait'
import { WebSocketServer } from "ws";
import express from "express";

const app = express();
const port = 8888;

let fever = false;
let superfever = false;
let clientA, clientB;
let locked = { a: false, b: false }
let fog = { a: false, b: false }
let items = {
  a: [], b: []
}
let position = {
  a: {
    x: 0, y: 0, direction: 0
  },
  b: {
    x: 0, y: 0, direction: 0
  }
}
let block = {
  a: {
    x: null, y: null, rotate: 0
  },
  b: {
    x: null, y: null, rotate: 0
  }
}
let flip = {
  a: {
    left: false, right: false
  },
  b: {
    left: false, right: false
  },
}
let ready = { a: false, b: false };
let reverse = { a: false, b: false };
let point = { a: 0, b: 0 };
let size = { a: 1, b: 1 }
let gravity_speed = { a: 0, b: 0 }
let width = { a: 1, b: 1 }
let power = { a: 1, b: 1 }

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
wss.on("connection", (socket) => {
  socket.on("message", (message) => { // 이벤트 처리
    let who;
    if (socket === clientA) {
      who = 'a'
    }
    else if (socket === clientB) {
      who = 'b'
    }

    if (who) {
      try {
        let o = message.toString().replace(/ /g, '').split(',')
        let object = []
        for (let i in o) {
          object[`${o[i].split(':')[0]}`] = o[i].split(":")[1]
        }
        // const object = JSON.parse(message)
        // return;
        const t = object?.type;
        // console.log(object, who)
        if (t === 'reset') {
          // 전부 리셋을 하는 코드가 필요.
          clientA.send("type: reset");
          clientB.send("type: reset");
        }
        if (t === 'ready_on') { //준비
          ready[who] = true;
          if (ready['a'] && ready['b']) { //게임 시작
            gameStart();
          }
          return;
        }
        if (t === 'ready_off') {
          ready[who] = false;
          return;
        }
        if (t == 'position') {
          if (locked[who]) {
            setTimeout(() => {
              locked[who] = false;
            }, 0.1);
            return;
          }
          point[who] = object.point;
          position[who].x = object.x;
          position[who].y = object.y;
          position[who].direction = object.direction;
        }

        if (t === 'item') {
          items[who].push({
            item: object.item,
            x: object.x,
            y: object.y
          });
          console.log(items[who])
          return;
        }
        if (t === 'get_item') {
          items[who] = items[who].filter(e => (e.x !== object.x || e.y !== object.y) && e);
          return;
        }
        if (t === 'my_flip') {
          flip[who].left = object.left;
          flip[who].right = object.right;

          return;
        }
        if (t === 'width') {
          if (who === 'a') {
            width['b'] = object.width;
            setTimeout(() => {
              width['b'] = 1;
            }, 15000);
          }
          else if (who === 'b') {
            width['a'] = object.width;
            setTimeout(() => {
              width['a'] = 1;
            }, 15000);
          }
          return;
        }
        if (t === 'reverse') {
          if (who === 'a') {
            reverse['b'] = true;
            setTimeout(() => {
              reverse['b'] = false;
            }, 4000);
          }
          else if (who === 'b') {
            reverse['a'] = true;
            setTimeout(() => {
              reverse['a'] = false;
            }, 4000);
          }
          return;
        }
        if (t === 'block_me') {
          block[who].x = object.x;
          block[who].y = object.y;
          block[who].rotate = object.rotate;
          return;
        }
        if (t === 'block') {
          if (who === 'a') {
            block['b'].x = object.x;
            block['b'].y = object.y;
            block['b'].rotate = object.rotate;
          }
          else if (who === 'b') {
            block['a'].x = object.x;
            block['a'].y = object.y;
            block['a'].rotate = object.rotate;
          }
          return;
        }
        if (t === 'del_block') {
          block[who].x = block[who].y = null;
          return;
        }
        if (t === 'gravity') {
          if (who === 'a') {
            power['b'] = object.gravity;
            gravity_speed['b'] = object.speed;
          }
          if (who === 'b') {
            power['a'] = object.gravity;
            gravity_speed['a'] = object.speed;
          }
          return;
        }
        if (t === 'my_gravity_speed') {
          power[who] = object.gravity;
          gravity_speed[who] = object.speed;
          return;
        }
        if (t === 'lock') {
          if (who === 'a') {
            gravity_speed['b'] = 0;
            locked['b'] = true;
          }
          else if (who === 'b') {
            gravity_speed['a'] = 0;
            locked['a'] = true;
          }
          return;
        }
        // if (t === 'floating') {
        //   if (who === 'a') {
        //     gravity_speed['b'] = -0.1 * 9.8 * (power['b'] * (parseInt(Math.random() * 6) + 7) / 10);
        //     setTimeout(() => {
        //       gravity_speed['b'] = 9.8 * power['b'];
        //     }, 5000);
        //   }
        //   else if (who === 'b') {
        //     gravity_speed['a'] = -0.1 * 9.8 * (power['a'] * (parseInt(Math.random() * 6) + 7) / 10);
        //     setTimeout(() => {
        //       gravity_speed['a'] = 9.8 * power['a'];
        //     }, 5000);
        //   }
        //   return;
        // }
        if (t === 'size') {
          if (who === 'a') {
            size['b'] = parseFloat(Math.random() * 10) + 5;
            setTimeout(() => {
              size['b'] = 1;
            }, 10000);
          }
          else if (who === 'b') {
            size['a'] = parseFloat(Math.random() * 10) + 5;
            setTimeout(() => {
              size['a'] = 1;
            }, 10000);
          }
          return;
        }
        if (t === 'fog') { // 이벤트 생성
          if (who === 'a') {
            fog['b'] = true;
            setTimeout(() => {
              fog['b'] = false;
            }, 5000);
            return;
          }
          if (who === 'b') {
            fog['a'] = true;
            setTimeout(() => {
              fog['a'] = false;
            }, 5000);
            return;
          }
          return;
        }
      } catch (e) {
        console.log("원하는 형식이 아님 " + e);
      }
    }
  });

  socket.on("close", () => { // 초기화
    if (socket === clientA) {
      clientA = null;
    }
    else if (socket === clientB) {
      clientB = null;
    }
  });

  if (!clientA) {
    clientA = socket;
  }
  else if (!clientB) {
    clientB = socket;
  }
  else {
    socket.send("full");
    socket.close();
    return;
  }
  socket.send('Connected');
});

async function gameStart() {
  const timelimit = new Date().getTime() + 3 * 60 * 1000;
  for (let i = 3; i >= 0; i--) {
    await wait(1000);
    clientA.send(`type: ready_start, time: ${i}`);
    clientB.send(`type: ready_start, time: ${i}`);
  }
  clientA.send("type:start");
  clientB.send("type:start");
  const inter = setInterval(() => {
    const current = new Date().getTime();
    if (timelimit - current <= 0) {
      clearInterval(inter);
      console.log('gameover')
      // clientA.send(JSON.stringify({
      //   type: 'end',
      //   win: point['a'] > point['b'],
      //   me: point['a'],
      //   enemy: point['b']
      // }))
      clientA.send(`type:end, win:${point['a'] > point['b']}, me: ${point['a']}, enemy: ${point['b']}`)
      clientB.send(`type:end, win:${point['a'] < point['b']}, me: ${point['b']}, enemy: ${point['a']}`)
      // clientB.send(JSON.stringify({
      //   type: 'end',
      //   win: point['b'] > point['a'],
      //   me: point['b'],
      //   enemy: point['a']
      // }))
      return;
    }
    if (!fever && timelimit - current <= 3000) {
      clientA.send("type:fiver_time");
      clientB.send("type:fiver_time");
      power['a'] = power['b'] = 1.5;
      fever = true;
    }
    if (!superfever && timelimit - current <= 1500) {
      clientA.send("type: super_fiver_time");
      clientB.send("type: super_fiver_time");
      power['a'] = power['b'] = 2;
      superfever = true;
    }
    //a에게 보낼 것
    const enemy_of_A = `
      type: play,
      ball_x: ${position['b'].x},
      ball_y: ${position['b'].y},
      direction: ${position['b'].direction},
      size: ${size['b']},
      point: ${point['b']},
      block_exist: ${block['b'].x && block['b'].y},
      block_x: ${block['b'].x || null},
      block_y:${block['b'].y || null},
      block_rotate:${block['b'].rotate},
      width: ${width['b']},
      flip_left: ${flip['b'].left},
      flip_right: ${flip['b'].right},
      reverse: ${reverse['b']},
      item:${items['b'][0]?.item},
      item_x: ${items['b'][0]?.x},
      item_y: ${items['b'][0]?.y},
    `
    const A_self = `
      type: my_play,
      timelimit: ${timelimit - current},
      ball_x: ${position['a'].x},
      ball_y:${position['a'].y},
      direction: ${position['a'].direction},
      size: ${size['a']},
      point:${point['a']},
      block_exist: ${block['a'].x && block['a'].y},
      block_x: ${block['a'].x || null},
      block_y: ${block['a'].y || null},
      block_rotate: ${block['a'].rotate},
      gravity:${power['a']},
      gravity_speed:${gravity_speed['a']},
      fog: ${fog['a']},
      width: ${width['a']},
      reverse:${reverse['a']},
      item:${items['a'][0]?.item},
      item_x: ${items['a'][0]?.x},
      item_y: ${items['a'][0]?.y}
      `
    // b에게 보낼 것 
    const enemy_of_B = `
      type: play,
      ball_x: ${position['a'].x},
      ball_y: ${position['a'].y},
      direction: ${position['a'].direction},
      size: ${size['a']},
      point: ${point['a']},
      block_exist: ${block['a'].x && block['a'].y},
      block_x: ${block['a'].x || null},
      block_y:${block['a'].y || null},
      block_rotate:${block['a'].rotate},
      width:${width['a']},
      flip_left:${flip['a'].left},
      flip_right:${flip['a'].right},
      reverse: ${reverse['a']},
      item:${items['a'][0]?.item},
      item_x: ${items['a'][0]?.x},
      item_y: ${items['a'][0]?.y}   
       `
    const B_self = `
      type: my_play,
      timelimit: ${timelimit - current},
      ball_x: ${position['b'].x},
      ball_y: ${position['b'].y},
      direction: ${position['b'].direction},
      size: ${size['b']},
      point: ${point['b']},
      block_exist: ${block['b'].x && block['b'].y},
      block_x: ${block['b'].x},
      block_y: ${block['b'].y},
      block_rotate: ${block['b'].rotate},
      gravity: ${power['b']},
      gravity_speed: ${gravity_speed['b']},
      fog: ${fog['b']},
      width: ${width['b']},
      reverse: ${reverse['b']},
      item:${items['b'][0]?.item},
      item_x: ${items['b'][0]?.x},
      item_y: ${items['b'][0]?.y},    
      `
    clientA.send(enemy_of_A);
    clientA.send(A_self);
    clientB.send(enemy_of_B);
    clientB.send(B_self);
  }, 0.1);
}

server.listen(port, () => {
  console.log(`Listening on ${port}`);
});