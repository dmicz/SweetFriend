import React from 'react';
import './RegisterForm.css';
import { useNavigate } from "react-router-dom";


const RegisterForm = () => {
    const navigate= useNavigate();
    function handleClick(){
        navigate("/app/dashboard");
    }
return (
    <div className='dialog'>
            <div className='wrapper'>
            <form method="post" action='/api/user_register'>
                <h1>Register</h1>
                <div className="input-box">
                    <input name="username" type="text" placeholder="Username" required />
                    
                </div>
                <div className="input-box">
                    <input name="password" type="password" placeholder="Password" required/>
                    
                </div>
                <button type="submit">Register</button>
                <div className="login-link">
                    <p>Have an account? <a href="/">Login</a></p>
                </div>
            </form>

        </div>
    </div>
  )
}

export default RegisterForm