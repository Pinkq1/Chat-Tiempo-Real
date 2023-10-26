document
  .getElementById("login-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log(username);
    console.log(password);

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log(data);
    if (response.status === 200) {
      window.location.href = "/chat";

      alert(data.message);
    } else {
      // Mostrar mensajes de error al usuario
      alert("Error: " + data.error);
    }
  });

const registerButton = document.getElementById("register-button");

registerButton.addEventListener("click", () => {
  // Redirige a la página de registro (registrar.html)
  window.location.href = "/register";
});