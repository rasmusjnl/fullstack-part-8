import React, { useState } from "react";

const LoginForm = ({ show, login, setToken, setPage }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  if (!show) {
    return null;
  }
  const handleSubmit = async event => {
    event.preventDefault();
    const res = await login({
      variables: {
        username: name,
        password
      }
    });

    if (res) {
      const token = res.data.login.value;
      setToken(token);
      localStorage.setItem("token", token);
      setPage("authors");
    }
  };
  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          Name <input onChange={({ target }) => setName(target.value)} />
        </div>
        <div>
          Password{" "}
          <input
            onChange={({ target }) => setPassword(target.value)}
            type="password"
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
