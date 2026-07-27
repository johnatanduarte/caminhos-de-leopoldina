// frontend/src/pages/Login.tsx
import { useState } from "react";
import "./Login.css"; // Importando o CSS puro

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de login:", { email, password });
    // Futura integração com o backend
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Caminhos de Leopoldina</h1>
          <p className="login-subtitle">
            Acesse sua conta para explorar as trilhas
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="forgot-password">
            <button type="button" className="forgot-password-btn">
              Esqueceu a senha?
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Entrar
          </button>
        </form>

        <div className="login-footer">
          <p>
            Ainda não tem conta?{" "}
            <button type="button" className="register-btn">
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
