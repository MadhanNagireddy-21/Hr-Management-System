'use client';
import { useState } from 'react';

export const useGreeting = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken');
        }
        return null;
    };

    const sendGreeting = async (request) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const token = getToken();
            if (!token) {
                setError('Authentication token not found. Please login again.');
                setLoading(false);
                return null;
            }
            const response = await fetch('http://localhost:8080/api/greeting/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Failed to send greeting');
                setLoading(false);
                return null;
            }
            setSuccess(data.message || 'Greeting sent successfully!');
            setLoading(false);
            return { success: true, ...data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(`Error: ${errorMessage}`);
            setLoading(false);
            return null;
        }
    };

    return {
        loading,
        error,
        success,
        sendGreeting,
    };
};