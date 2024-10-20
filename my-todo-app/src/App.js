import React, { useState } from 'react';
import Login from './Login/Login';
import Signup from './Signup/Signup';
import './App.css';
import TodoList from './Todolist/TodoList';


const App = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(null);
    const handleLogin = (token) => {
        console.log('Login attempt:');
        // Simulate successful login
        setIsAuthenticated(true);
        setToken(token);
    };

    const handleSignup = (username, password) => {
        console.log('Signup attempt:', username, password);
        // Simulate successful signup
        setIsLogin(true);
    };

    return (
        <div className="app-container">
            {!isAuthenticated ? (
                isLogin ? (
                    <Login onLogin={handleLogin} switchToSignup={() => setIsLogin(false)} />
                ) : (
                    <Signup onSignup={handleSignup} switchToLogin={() => setIsLogin(true)} />
                )
            ) : (
                <TodoList token={token}/>
            )}
        </div>
    );
};



export default App;
