const { app, BrowserWindow } = require('electron')
const path = require('path')


//app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;



function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})


let roomList = [];

const createRoom = (roomName, user) => {
  return {
    name: roomName,
    users: user === undefined ? [] : [user],
  };
};

/*app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});*/

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    let roomResult;
    for (let room of roomList) {
      if (room.users.find((user) => user.id === socket.id) !== undefined)
        roomResult = room;
    }
    if (roomResult !== undefined) {
      roomResult.users.map((socket) => {
        socket.emit("chat message", msg);
      });
    } else {
      console.log("the user is not in a room");
    }
  });

  socket.on("command", (msg) => {
    const [cmd, arg] = msg.split(" ");

    switch (cmd) {
      case "/join": {
        let room = roomList.find((x) => x.name === arg);
        if (room !== undefined) {
          room.users.push(socket);
        }
        break;
      }
      case "/create": {
        roomList.push(createRoom(arg));
        break;
      }
      case "/list": {
        socket.emit(
          "list",
          roomList.map((e) => e.name)
        );
        break;
      }
    }
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});




app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})