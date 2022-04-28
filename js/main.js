'use strict'

const client_version = 'CV-000 [28-04-2022]';

// INTERFACE

const clientsCounter = document.getElementById('clientsCounter');
const connectionId = document.getElementById('connectionId');

let connectionIs = false;
let myId;

// CANVAS

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const C_WIDTH = canvas.width = 1200;
const C_HEIGHT = canvas.height = 600;

const planeImage = new Image();
planeImage.src = './src/images/planes.png';

const planeFrames = 4;
const planeWidth = 100;
const planeHeight = 100;
const planeHalfWidth = 50;
const planeHalfHeight = 50;

const START_X = C_WIDTH / 2;
const START_Y = C_HEIGHT - planeHalfHeight;

class Plane {
  constructor (id) {
    this.id = id;
    this.x = START_X;
    this.y = START_Y;
    this.direction = 0;
  }
}

let planesArr = [];

function drawPlane (id, image, frame, x, y, angle) {
  let frameY = (id == myId) ? 0 : planeHeight;
  ctx.save();
  ctx.translate(x + planeHalfWidth, y + planeHalfHeight / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-(x + planeHalfWidth), -(y + planeHalfHeight));
  ctx.drawImage(image, frame, frameY, planeWidth, planeHeight, x, y, planeWidth, planeHeight);
  ctx.restore();
}

let frame = 0;
const background = new Image();
background.src = './src/images/map.jpg';

function animate() {
  
  ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

  let planeFrame = (frame % planeFrames) * planeWidth;
    
  if (connectionIs) {

    ctx.drawImage(background,0,0);

    drawPlane (image, 0, planeImage, x, y, player.direction);

    planesArr.forEach( plane => drawPlane (plane.id, image, planeFrame, plane.x, plane.y, plane.direction) );

  }

  frame++;
  window.requestAnimationFrame(animate);

}

animate();

// CONTROLLERS

document.addEventListener('keypress', (event) => {
  if (connectionIs) sendMove(event.code);
}, false);

// CONNECTION

const socketURL = 'wss://mars-game-server.herokuapp.com' // 'ws://localhost:9000' 
let SOCKET;

function connection() {
  console.log('-- connection request --');

  let socket = new WebSocket(socketURL);

  socket.onopen = function () {
    console.log('-- socket on open-- ');
    socket.send(JSON.stringify({ action: 'firstConnect' }));
  };
  /*
  socket.onmessage = function (message) {
    let { action, data } = JSON.parse(message.data);
    switch (action) {
      case 'firstConnect' :
        SOCKET = socket;
        getConnectionStart(data);
        break;
      case 'update' : getUpdate(data); break;
      default : getWrongActionInResponse(action, data);
    }
  };
  */
  socket.onclose = function(event) {
    if (event.wasClean) {
      console.group('-- socket on close --');
      console.log(' - clean close connection');
      console.log(' - code: ${event.code}');
      console.log(' - reason: ${event.reason}');
      console.groupEnd();
    } else {
      console.group('-- socket on close --');
      console.log(' - connection terminated:');
      console.log(' - ' + event);
      console.groupEnd();
    }
    connection();
  };
  
  socket.onerror = function(error) {
    console.group('-- socket on error --');
    console.log(' - connection error:');
    console.log(' - ' + error);
    console.groupEnd();
  };

}
connection();

function getConnectionStart(data) {
  connectionId.innerText = data;
  myId = data;
}

function getUpdate(data) {
  planesArr = data;
  clientsCounter.innerText = planesArr.length;
  if (planesArr.length > 0) connectionIs = true;
  else connectionIs = false;
}

function sendMove(code) {
  switch(code) {
    //case 'KeyW' : SOCKET.send(JSON.stringify({ action: 'move', data: {p: myId, x: 0, y: -1 } })); break;
    //case 'KeyS' : SOCKET.send(JSON.stringify({ action: 'move', data: {p: myId, x: 0, y: 1 } })); break;
    case 'KeyA' : SOCKET.send(JSON.stringify({ action: 'turn', data: {id: myId, direction: -1 } })); break;
    case 'KeyD' : SOCKET.send(JSON.stringify({ action: 'turn', data: {id: myId, direction: 1 } })); break;
  }
}