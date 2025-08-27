import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { login, register, loginAsGuest } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;
      
      if (isRegistering) {
        success = await register(formData.email, formData.password, formData.displayName);
      } else {
        success = await login(formData.email, formData.password);
      }

      if (!success) {
        setError(isRegistering ? 'Falha no registro' : 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro no servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const success = await loginAsGuest();
      if (!success) {
        setError('Falha no login como convidado');
      }
    } catch (err) {
      setError('Erro no servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ChatStream</h1>
          <p>Chat em tempo real e streaming de vídeo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="displayName">Nome de Exibição</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processando...' : (isRegistering ? 'Registrar' : 'Entrar')}
          </button>
        </form>

        <div className="login-actions">
          <button
            type="button"
            className="btn-link"
            onClick={() => setIsRegistering(!isRegistering)}
            disabled={loading}
          >
            {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Registre-se'}
          </button>

          <div className="divider">ou</div>

          <button
            type="button"
            className="btn-guest"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Continuar como Convidado'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;