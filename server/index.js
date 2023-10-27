import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { createClient } from "@libsql/client";
import { check, validationResult } from "express-validator";
import dotenv from "dotenv";
import session from "express-session";
import bcrypt from "bcrypt";



dotenv.config();

const port = process.env.PORT ?? 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const db = createClient({
  url: 'libsql://pro-cottonmouth-pinkq1.turso.io',
  authToken: process.env.DB_TOKEN,
});

app.use(express.json());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.post(
  "/login",
  [
    check("username")
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio"),
    check("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    console.log("Solicitud POST a /login");
    const { username, password } = req.body;

    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      //console.log("Valor de username:", username);
      const result = await db.execute({
        sql: "SELECT user_id,username,password FROM users WHERE username = ?",
        args: [username],
        
      });

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      const storedPassword = result.rows[0].password;

      if (password.trim() === storedPassword.trim()) {
        //console.log("Contraseña válida");
        app.set('username', username);
       //   req.session.username = username;
        console.log(username);
        return res.status(200).json({ message: "Inicio de sesión exitoso" });
         // Establecer la sesión
      } else {
        console.log("Contraseña incorrecta");
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }
    } catch (error) {
      console.error("Error en la base de datos:", error);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
  }
);

app.post(
  "/register",
  [
    check("username")
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio"),
    check("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    console.log("Solicitud POST a /register");
    const { username, password } = req.body;

    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await db.execute({
        sql: "INSERT INTO users (username, password) VALUES (?, ?)",
        args: [username, password],
      });

      return res.status(200).json({ message: "Registro exitoso" });
    } catch (error) {
      console.error("Error en la base de datos:", error);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
  }
);



await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  `);

await db.execute(`
CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  user_id_message INTEGER,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id_message) REFERENCES users(user_id)
);
`);

const connectedUsers = new Map();

io.on("connection", async (socket) => {
  console.log("Un usuario se ha conectado");
  const username = app.get('username') || "anonymus";
  
connectedUsers.set(socket.id, username);

  sendConnectedUsers();
  console.log(username);

  socket.on("disconnect", () => {
    console.log("Un usuario se ha desconectado");
    connectedUsers.delete(socket.id);
    
    sendConnectedUsers();
  });

  socket.on("chat message", async (msg) => {
    const username = socket.handshake.auth.username ?? "anonymus";

    // Inserta el mensaje en la base de datos
    try {
      const result = await db.execute({
        sql: "INSERT INTO messages (content, user_id_message, fecha) VALUES (:msg, (SELECT username FROM users WHERE user_id = :user_id_message), CURRENT_TIMESTAMP)",
        args: { msg, user_id_message: username },
      });
  
      const fechaChile = new Date().toUTCString();
      io.emit(
        "chat message",
        msg,
        result.lastInsertRowid.toString(),
        username,
        fechaChile
      );
    } catch (e) {
      console.error(e);
      return;
    }
  });
  // ... (código previo)

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: "SELECT id, content, user_id_message, fecha FROM messages WHERE id > ?",
        args: [socket.handshake.auth.serverOffset ?? 0],
      });

      results.rows.forEach((row) => {
        // Recupera el nombre de usuario a partir del user_id_message
        const username = row.user_id_message;

        const fechaChile = new Date().toUTCString();
        socket.emit(
          "chat message",
          row.content,
          row.id.toString(),
          username,
          fechaChile
        );
      });
    } catch (e) {
      console.log(e);
      return;
    }
  }
});



function sendConnectedUsers() {
  const usersArray = Array.from(connectedUsers.values());
  io.emit("user-list", usersArray);
}

app.use(express.static("public"));
app.use(logger("dev"));

app.get("/chat", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

app.get("/register", (req, res) => {
  res.sendFile(process.cwd() + "/client/register.html");
});

app.get("/", (req, res) => {
  


  
  res.sendFile(process.cwd() + "/client/login.html");
});


server.listen(port, () => {
  console.log(`server running on port ${port}`);
});