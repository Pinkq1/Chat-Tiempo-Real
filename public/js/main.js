import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";

const getUsername = async () => {
  
  const username = localStorage.getItem("username");
  console.log(username);
  if (username) {
    console.log(`User exists: ${username}`);
    return username;
  }


 };


 const socket = io({
  auth: {
    username: await getUsername(),
    serverOffset: 0,
  },
});

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("user-list");

socket.on("user-list", (users) => {
  userList.innerHTML = "";
  users.forEach((user) => {
    const listItem = document.createElement("li");
    listItem.textContent = user;
    userList.appendChild(listItem);
  });
});

socket.on("chat message", (msg, serverOffset, username, fecha) => {
  const formatoHora = new Date(fecha).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    hour: "numeric",
    minute: "2-digit",
  });
  const formatoFecha = new Date(fecha).toLocaleString("es-CL", {
    month: "short",
    day: "numeric",
  });
console.log(username);
  const item = `<li>
    <strong id="username_name">${username}</strong>
    <p id="message_content">${msg}</p>
    <small id="date_messages">
      <span>${formatoHora}</span>  <span>${formatoFecha}</span>
    </small>
  </li>`;

  messages.insertAdjacentHTML("beforeend", item);
  socket.auth.serverOffset = serverOffset;
  messages.scrollTop = messages.scrollHeight;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});