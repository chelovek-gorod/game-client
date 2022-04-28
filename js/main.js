'use strict'

const client_version = 'CV-010 [28-04-2022]';
console.log('CLIENT', client_version);

/*****************
 *  INTERFACE
 */

const clientsCounter = document.getElementById('clientsCounter');
const connectionId = document.getElementById('connectionId');

const directionSpan = document.getElementById('directionSpan');

let connectionIs = false;
let myId;

/*****************
 *  CONTROLLERS
 */

 let toLeftIs = false;
 let toRightIs = false;
 let turnSpeed = 0.5;
 let turnSize = 0;
 
 document.addEventListener('keydown', (event) => {
   switch(event.code) {
     case 'KeyA' : toLeftIs = true; break;
     case 'KeyD' : toRightIs = true; break;
   }
   
 });

 document.addEventListener('keyup', (event) => {
  switch(event.code) {
    case 'KeyA' : toLeftIs = false; break;
    case 'KeyD' : toRightIs = false; break;
    //
    case 'KeyT' : turnSpeed += 0.5; console.log('turnSpeed =', turnSpeed); break;
    case 'KeyY' : if (turnSpeed > 0.5) turnSpeed -= 0.5; console.log('turnSpeed =', turnSpeed); break;
  }
  
});

/*****************
 *  CANVAS
 */

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

let planesArr = [];

function drawPlane (id, image, frame, x, y, angle) {
  let frameY = (id == myId) ? 0 : planeHeight;
  angle = (360 + angle) % 360;
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

  if (toLeftIs != toRightIs) sendUpdate();
  
  ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

  let planeFrame = (frame % planeFrames) * planeWidth;
    
  if (connectionIs) {

    ctx.drawImage(background,0,0);

    planesArr.forEach( plane => drawPlane (plane.id, planeImage, planeFrame, plane.x, plane.y, plane.direction) );

  }

  frame++;
  window.requestAnimationFrame(animate);

}

animate();

/*****************
 *  CONNECTION
 */

const socketURL = 'ws://192.168.100.51:6789'; //'wss://mars-game-server.herokuapp.com' // 'ws://localhost:6789' 
let SOCKET;

function connection() {
  console.log('-- connection request --');

  let socket = new WebSocket(socketURL);

  socket.onopen = function () {
    console.log('-- socket on open-- ');
    socket.send(JSON.stringify({ action: 'connect' }));
  };
  
  socket.onmessage = function (message) {
    let { action, data } = JSON.parse(message.data);
    switch (action) {
      case 'connect' :
        SOCKET = socket;
        getConnect(data);
        break;
      case 'update' : getUpdate(data); break;
      default : getWrongActionInResponse(action, data);
    }
  };
  
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
    setTimeout(connection, 5000);
  };
  
  socket.onerror = function(error) {
    console.group('-- socket on error --');
    console.log(' - connection error:');
    console.log(' - ' + error);
    console.groupEnd();
  };

}
connection();

function getConnect(data) {
  connectionId.innerText = data;
  myId = data; console.log('GET ID', data);
  SOCKET.send(JSON.stringify({ action: 'update', data: { id: myId, direction: 0 } }));
}

function getUpdate(data) {
  planesArr = data;
  clientsCounter.innerText = planesArr.length;
  let myPlane = data.find(client => client.id == myId);
  myPlane.direction = (360 + myPlane.direction) % 360;
  directionSpan.innerHTML = myPlane.direction;
  if (planesArr.length > 0) connectionIs = true;
  else connectionIs = false;
}

function sendUpdate() {
  turnSize = toLeftIs ? -turnSpeed : turnSpeed;
  SOCKET.send(JSON.stringify({ action: 'update', data: {id: myId, direction: turnSize } }));
}