import React, { useState } from 'react';
import './Signup.css';

const Signup = ({ onSignup, switchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Helper functions for validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    // Updated handleSubmit with validation logic
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate username as email
        if (!isValidEmail(username)) {
            alert("Please enter a valid email address.");
            return;
        }

        // Validate password
        if (!isValidPassword(password)) {
            alert("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_name: username, password }),
            });

            if (!response.ok) {
                throw new Error('Signup failed');
            }

            const data = await response.json();
            onSignup(); // Assuming this handles post-signup actions
            alert(data.message);
        } catch (error) {
            console.error(error);
            alert('Signup failed. Please try again.');
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Sign Up</button>
                <p>
                    Already have an account?{' '}
                    <button type="button" className="switch-button" onClick={switchToLogin}>
                        Login
                    </button>
                </p>
            </form>
        </div>
    );
};

export default Signup;