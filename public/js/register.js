document
  .getElementById("register-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log(username);
    console.log(password);

    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 200) {
      // El registro fue exitoso
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      window.location.href = "/login"; // Redirige a la página de inicio de sesión
    } else {
      // Mostrar mensajes de error en caso de problemas con el registro
      const data = await response.json();
      alert("Error en el registro: " + data.error);
    }
  });