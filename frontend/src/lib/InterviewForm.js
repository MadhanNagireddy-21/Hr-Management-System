'use client';

import { useState } from 'react';

export const useInterview = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken');
        }
        return null;
    };

    const sendOnlineInterview = async (request) => {
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

            const response = await fetch('http://localhost:8080/api/greeting/send-online-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to send online interview email');
                setLoading(false);
                return null;
            }

            setSuccess(data.message);
            setLoading(false);
            return data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(`Error: ${errorMessage}`);
            setLoading(false);
            return null;
        }
    };

    const sendOfflineInterview = async (request) => {
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

            const response = await fetch('http://localhost:8080/api/greeting/send-offline-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to send offline interview email');
                setLoading(false);
                return null;
            }

            setSuccess(data.message);
            setLoading(false);
            return data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(`Error: ${errorMessage}`);
            setLoading(false);
            return null;
        }
    };

    const sendOfferLetter = async (request) => {
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

            const response = await fetch('http://localhost:8080/api/greeting/send-offer-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to send offer letter');
                setLoading(false);
                return null;
            }

            setSuccess(data.message);
            setLoading(false);
            return data;

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
        sendOnlineInterview,
        sendOfflineInterview,
        sendOfferLetter,
    };
};