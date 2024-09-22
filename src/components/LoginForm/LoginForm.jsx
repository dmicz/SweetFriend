import React from 'react';
import './LoginForm.css';
import { useNavigate } from "react-router-dom";


const LoginForm = () => {
    const navigate= useNavigate();
    function handleClick(){
        navigate("/app/dashboard");
    }
  return (
    <div className='dialog'>
        <div className='wrapper'>
            <img className="login_logo" src="/src/assets/login.svg" alt="Sweet Friend's Icon"></img>
            <form method="post" action='/api/user_login'>
                <h1>Login</h1>
                <div className="input-box">
                    <input name="username" type="text" placeholder="Username" required />
                    
                </div>
                <div className="input-box">
                    <input name="password" type="password" placeholder="Password" required/>
                    
                </div>
                <div className="remember-forgot">
                    <label><input type="checkbox" />Remember me</label>
                    <a href="#">Forgot password</a>
                </div>
                <button type="submit">Login</button>
                <div className="register-link">
                    <p>Don't have an account? <a href="/register">Register</a></p>
                </div>
            </form>

        </div>
    </div>
  )
}

export default LoginForm