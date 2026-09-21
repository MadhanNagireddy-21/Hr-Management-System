'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from 'next-themes';

import {
    Bot,
    X,
    Send,
    Sparkles,
    UserRound,
    Minimize2,
    RotateCcw,
    Clock3,
    CalendarDays,
    WalletCards,
    GraduationCap,
    Users,
    BriefcaseBusiness,
    ChevronRight,
} from 'lucide-react';

import './HRChatbot.css';

// ============================================================
// API CONFIGURATION
// ============================================================
//
// IMPORTANT:
// For production, set:
//
// NEXT_PUBLIC_API_URL=https://api.saitejainfotechprivatelimited.com
//
// in the Vercel environment variables and rebuild/redeploy.
//
// The fallback below is used only when the environment variable
// is not available during the build.
//

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.saitejainfotechprivatelimited.com'
).replace(/\/+$/, '');

// ============================================================
// QUICK ACTIONS
// ============================================================

const QUICK_ACTIONS = {
    EMPLOYEE: [
        {
            label: 'My leave balance',
            icon: CalendarDays,
            message: 'What is my leave balance?',
        },
        {
            label: "Today's attendance",
            icon: Clock3,
            message: "What's my attendance today?",
        },
        {
            label: 'My payslip',
            icon: WalletCards,
            message: 'Where can I find my payslip?',
        },
        {
            label: 'My training',
            icon: GraduationCap,
            message: 'Show me my training information.',
        },
    ],

    HR: [
        {
            label: 'Employee count',
            icon: Users,
            message: 'How many employees are there?',
        },
        {
            label: 'Pending leaves',
            icon: CalendarDays,
            message: 'Show me pending leave requests.',
        },
        {
            label: 'Recruitment',
            icon: BriefcaseBusiness,
            message: 'Give me the recruitment status.',
        },
        {
            label: 'Training status',
            icon: GraduationCap,
            message: 'Show me the training status.',
        },
    ],

    ADMIN: [
        {
            label: 'HR summary',
            icon: Sparkles,
            message: 'Give me an HR summary.',
        },
        {
            label: 'Employee count',
            icon: Users,
            message: 'How many employees are there?',
        },
        {
            label: 'Attendance',
            icon: Clock3,
            message: "Give me today's attendance summary.",
        },
        {
            label: 'Recruitment',
            icon: BriefcaseBusiness,
            message: 'Give me the recruitment status.',
        },
    ],
};

// ============================================================
// ROLE
// ============================================================

function getRole(user) {
    const role = String(
        user?.role ||
        user?.roles?.[0] ||
        user?.authorities?.[0]?.authority ||
        'EMPLOYEE'
    ).toUpperCase();

    if (role.includes('ADMIN')) {
        return 'ADMIN';
    }

    if (role.includes('HR')) {
        return 'HR';
    }

    return 'EMPLOYEE';
}

// ============================================================
// FIRST NAME
// ============================================================

function getFirstName(name) {
    if (!name) {
        return 'there';
    }

    return String(name)
        .trim()
        .split(/\s+/)[0];
}

// ============================================================
// GREETING
// ============================================================

function getGreeting(role, name) {
    const firstName = getFirstName(name);

    return `Hello ${firstName} 👋`;
}

// ============================================================
// WELCOME TEXT
// ============================================================

function getWelcomeText(role) {
    if (role === 'ADMIN') {
        return 'I’m your HRMS AI Assistant. I can help you understand workforce, attendance, recruitment, training and other HR information.';
    }

    if (role === 'HR') {
        return 'I’m your HRMS AI Assistant. I can help you with employees, leave requests, recruitment, training and HR operations.';
    }

    return 'I’m your HRMS AI Assistant. I can help you with your leave, attendance, payslip, training and HRMS information.';
}

// ============================================================
// FORMAT BACKEND RESPONSE
// ============================================================

function getBackendReply(response) {
    const root = response?.data;

    // --------------------------------------------------------
    // Backend format:
    //
    // {
    //   success: true,
    //   message: "...",
    //   data: {
    //      reply: "...",
    //      type: "...",
    //      leaveBalances: []
    //   }
    // }
    // --------------------------------------------------------

    const nestedData = root?.data;

    if (typeof nestedData?.reply === 'string') {
        const backendType = String(
            nestedData?.type || ''
        ).toUpperCase();

        let type = 'normal';

        if (
            backendType === 'LEAVE_BALANCE' ||
            backendType.includes('LEAVE')
        ) {
            type = 'leave-balance';
        } else if (
            backendType.includes('TRAINING') ||
            Array.isArray(nestedData?.trainings)
        ) {
            type = 'training';
        } else if (
            backendType.includes('RECRUITMENT') ||
            backendType.includes('JOB') ||
            Array.isArray(nestedData?.jobs) ||
            Array.isArray(nestedData?.recruitmentApplications)
        ) {
            type = 'recruitment';
        }

        return {
            text: nestedData.reply,
            type,
            data: nestedData,
        };
    }

    // --------------------------------------------------------
    // Direct reply
    // --------------------------------------------------------

    if (typeof root?.reply === 'string') {
        return {
            text: root.reply,
            type: 'normal',
            data: root,
        };
    }

    // --------------------------------------------------------
    // message
    // --------------------------------------------------------

    if (typeof root?.message === 'string') {
        return {
            text: root.message,
            type: 'normal',
            data: root,
        };
    }

    // --------------------------------------------------------
    // response
    // --------------------------------------------------------

    if (typeof root?.response === 'string') {
        return {
            text: root.response,
            type: 'normal',
            data: root,
        };
    }

    // --------------------------------------------------------
    // answer
    // --------------------------------------------------------

    if (typeof root?.answer === 'string') {
        return {
            text: root.answer,
            type: 'normal',
            data: root,
        };
    }

    // --------------------------------------------------------
    // content
    // --------------------------------------------------------

    if (typeof root?.content === 'string') {
        return {
            text: root.content,
            type: 'normal',
            data: root,
        };
    }

    // --------------------------------------------------------
    // String response
    // --------------------------------------------------------

    if (typeof root === 'string') {
        return {
            text: root,
            type: 'normal',
            data: {},
        };
    }

    return {
        text:
            'I received a response from the HRMS server, but I could not read the response correctly.',
        type: 'info',
        data: root || {},
    };
}

// ============================================================
// API ERROR MESSAGE
// ============================================================

function getApiErrorMessage(error) {
    const status = error?.response?.status;

    if (status === 401) {
        return 'Your HRMS session has expired. Please log in again and try again.';
    }

    if (status === 403) {
        return 'You do not have permission to access this HRMS information.';
    }

    if (status === 404) {
        return 'The HR Assistant API endpoint was not found on the server.';
    }

    if (status >= 500) {
        return 'The HRMS server encountered an error while processing your request. Please try again.';
    }

    const message = String(
        error?.message || ''
    ).toLowerCase();

    if (
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('timeout')
    ) {
        return 'Unable to connect to the HRMS API server. Please check that the live backend is running and reachable.';
    }

    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong while contacting the HR Assistant. Please try again.'
    );
}

// ============================================================
// FORMAT LEAVE BALANCE DATA
// ============================================================

function formatLeaveBalances(data) {
    if (Array.isArray(data?.leaveBalances)) {
        return data.leaveBalances;
    }

    if (Array.isArray(data?.balances)) {
        return data.balances;
    }

    return null;
}

// ============================================================
// FORMAT LEAVE NAME
// ============================================================

function formatLeaveName(leaveType) {
    if (!leaveType) {
        return 'Leave';
    }

    switch (String(leaveType).toUpperCase()) {
        case 'ANNUAL':
            return 'Annual';

        case 'SICK':
            return 'Sick';

        case 'CASUAL':
            return 'Casual';

        case 'PATERNITY':
            return 'Paternity';

        case 'MATERNITY':
            return 'Maternity';

        case 'UNPAID':
            return 'Unpaid';

        default:
            return String(leaveType)
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                );
    }
}

// ============================================================
// NUMBER FORMATTER
// ============================================================

function formatNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '0';
    }

    if (
        String(value).toLowerCase() === 'unlimited'
    ) {
        return '∞';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return String(value);
    }

    if (Number.isInteger(number)) {
        return String(number);
    }

    return number.toFixed(2);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HRChatbot() {
    const user = useSelector(
        (state) =>
            state?.auth?.user ||
            state?.user?.user ||
            state?.auth?.employee ||
            null
    );

    const { resolvedTheme } = useTheme();

    const role = getRole(user);

    const isDark = resolvedTheme === 'dark';

    const [isOpen, setIsOpen] = useState(false);

    const [isMinimized, setIsMinimized] =
        useState(false);

    const [message, setMessage] = useState('');

    const [isTyping, setIsTyping] =
        useState(false);

    const [messages, setMessages] = useState(() => [
        {
            id: 'welcome',
            sender: 'bot',
            text: getWelcomeText(role),
            time: new Date(),
            type: 'welcome',
            data: null,
        },
    ]);

    const messagesEndRef = useRef(null);

    const inputRef = useRef(null);

    const quickActions =
        QUICK_ACTIONS[role] ||
        QUICK_ACTIONS.EMPLOYEE;

    // ==========================================================
    // USER NAME
    // ==========================================================

    const userName =
        user?.name ||
        user?.fullName ||
        user?.employeeName ||
        user?.username ||
        user?.firstName ||
        'there';

    // ==========================================================
    // AUTO SCROLL
    // ==========================================================

    useEffect(() => {
        if (!isOpen || isMinimized) {
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [
        messages,
        isTyping,
        isOpen,
        isMinimized,
    ]);

    // ==========================================================
    // INPUT FOCUS
    // ==========================================================

    useEffect(() => {
        if (!isOpen || isMinimized) {
            return;
        }

        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 150);

        return () => clearTimeout(timer);
    }, [isOpen, isMinimized]);

    // ==========================================================
    // ROLE CHANGE
    // ==========================================================

    useEffect(() => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: 'bot',
                text: getWelcomeText(role),
                time: new Date(),
                type: 'welcome',
                data: null,
            },
        ]);
    }, [role]);

    // ==========================================================
    // ADD MESSAGE
    // ==========================================================

    const addMessage = (
        sender,
        text,
        type = 'normal',
        data = null
    ) => {
        setMessages((previous) => [
            ...previous,
            {
                id: `${sender}-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                sender,
                text,
                time: new Date(),
                type,
                data,
            },
        ]);
    };

    // ==========================================================
    // GET ACCESS TOKEN
    // ==========================================================

    const getAccessToken = () => {
        if (
            typeof window === 'undefined'
        ) {
            return null;
        }

        const possibleKeys = [
            'accessToken',
            'token',
            'jwtToken',
            'jwt',
            'authToken',
            'access_token',
        ];

        // ------------------------------------------------------
        // SESSION STORAGE
        // ------------------------------------------------------

        for (const key of possibleKeys) {
            const value =
                sessionStorage.getItem(key);

            if (value) {
                return value;
            }
        }

        // ------------------------------------------------------
        // LOCAL STORAGE
        // ------------------------------------------------------

        for (const key of possibleKeys) {
            const value =
                localStorage.getItem(key);

            if (value) {
                return value;
            }
        }

        return null;
    };

    // ==========================================================
    // SEND MESSAGE TO REAL BACKEND
    // ==========================================================

    const sendMessage = async (
        customMessage = null
    ) => {
        const text = String(
            customMessage !== null
                ? customMessage
                : message
        ).trim();

        if (!text || isTyping) {
            return;
        }

        // ------------------------------------------------------
        // Add user message
        // ------------------------------------------------------

        addMessage(
            'user',
            text,
            'normal',
            null
        );

        setMessage('');

        setIsTyping(true);

        try {
            // ==================================================
            // GET TOKEN
            // ==================================================

            const accessToken =
                getAccessToken();

            if (!accessToken) {
                const authError =
                    new Error(
                        'No active HRMS session was found. Please log in again.'
                    );

                authError.response = {
                    status: 401,
                    data: {
                        message:
                            'No active HRMS session was found.',
                    },
                };

                throw authError;
            }

            // ==================================================
            // API URL
            // ==================================================

            const apiUrl =
                `${API_BASE_URL}/api/chatbot/message`;

            console.log(
                'HR Chatbot API URL:',
                apiUrl
            );

            // ==================================================
            // API REQUEST
            // ==================================================

            const response =
                await fetch(apiUrl, {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',

                        Authorization:
                            `Bearer ${accessToken}`,
                    },

                    body: JSON.stringify({
                        message: text,
                    }),
                });

            // ==================================================
            // READ RESPONSE
            // ==================================================

            let responseData = null;

            const contentType =
                response.headers.get(
                    'content-type'
                ) || '';

            if (
                contentType.includes(
                    'application/json'
                )
            ) {
                try {
                    responseData =
                        await response.json();
                } catch {
                    responseData = null;
                }
            } else {
                try {
                    const textResponse =
                        await response.text();

                    responseData =
                        textResponse || null;
                } catch {
                    responseData = null;
                }
            }

            console.log(
                'HR Chatbot API Response:',
                responseData
            );

            // ==================================================
            // HTTP ERROR
            // ==================================================

            if (!response.ok) {
                const errorMessage =
                    responseData?.message ||
                    responseData?.error ||
                    responseData?.data?.message ||
                    `Request failed with status ${response.status}`;

                const requestError =
                    new Error(errorMessage);

                requestError.response = {
                    status:
                        response.status,

                    data:
                        responseData,
                };

                throw requestError;
            }

            // ==================================================
            // FORMAT BACKEND RESPONSE
            // ==================================================

            const backendResponse =
                getBackendReply({
                    data: responseData,
                });

            // ==================================================
            // LEAVE BALANCE
            // ==================================================

            const leaveBalances =
                formatLeaveBalances(
                    backendResponse.data
                );

            // ==================================================
            // RESPONSE DATA
            // ==================================================

            let messageData =
                backendResponse.data;

            if (
                backendResponse.type ===
                'leave-balance' &&
                leaveBalances
            ) {
                messageData =
                    leaveBalances;
            }

            // ==================================================
            // ADD BOT RESPONSE
            // ==================================================

            addMessage(
                'bot',

                backendResponse.text ||
                'The HR Assistant returned an empty response.',

                backendResponse.type ||
                'normal',

                messageData
            );
        } catch (error) {
            console.error(
                'HR Chatbot API Error:',
                error
            );

            addMessage(
                'bot',
                getApiErrorMessage(error),
                'info',
                null
            );
        } finally {
            setIsTyping(false);
        }
    };

    // ==========================================================
    // ENTER KEY
    // ==========================================================

    const handleKeyDown = (event) => {
        if (
            event.key === 'Enter' &&
            !event.shiftKey
        ) {
            event.preventDefault();

            sendMessage();
        }
    };

    // ==========================================================
    // CLEAR CHAT
    // ==========================================================

    const clearChat = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: 'bot',
                text: getWelcomeText(role),
                time: new Date(),
                type: 'welcome',
                data: null,
            },
        ]);

        setIsTyping(false);

        setMessage('');
    };

    // ==========================================================
    // FORMAT TIME
    // ==========================================================

    const formatTime = (date) => {
        try {
            return new Intl.DateTimeFormat(
                'en-IN',
                {
                    hour: '2-digit',
                    minute: '2-digit',
                }
            ).format(new Date(date));
        } catch {
            return '';
        }
    };

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <>
            {/* =================================================
                FLOATING CHAT BUTTON
            ================================================== */}

            {!isOpen && (
                <button
                    type="button"
                    className={`hr-chatbot-launcher ${isDark ? 'dark' : ''
                        }`}
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                    }}
                    aria-label="Open HR Assistant"
                    title="Ask HR Assistant"
                >
                    <span className="hr-chatbot-launcher-glow" />

                    <span className="hr-chatbot-launcher-icon">
                        <Bot
                            size={25}
                            strokeWidth={2.2}
                        />
                    </span>

                    <span className="hr-chatbot-online-dot" />

                    <span className="hr-chatbot-launcher-text">
                        Ask HR
                    </span>
                </button>
            )}

            {/* =================================================
                CHAT WINDOW
            ================================================== */}

            {isOpen && (
                <div
                    className={`hr-chatbot-wrapper ${isDark ? 'dark' : ''
                        } ${isMinimized
                            ? 'minimized'
                            : ''
                        }`}
                >
                    <div className="hr-chatbot-window">

                        {/* =================================================
                            HEADER
                        ================================================== */}

                        <div className="hr-chatbot-header">

                            <div className="hr-chatbot-header-left">

                                <div className="hr-chatbot-avatar">

                                    <Bot
                                        size={22}
                                        strokeWidth={2.2}
                                    />

                                    <span className="hr-chatbot-avatar-status" />

                                </div>

                                <div className="hr-chatbot-header-info">

                                    <div className="hr-chatbot-title-row">

                                        <h3>
                                            HR Assistant
                                        </h3>

                                        <span className="hr-chatbot-ai-badge">

                                            <Sparkles
                                                size={10}
                                            />

                                            AI

                                        </span>

                                    </div>

                                    <p>
                                        {role ===
                                            'ADMIN'
                                            ? 'Admin Assistant'
                                            : role ===
                                                'HR'
                                                ? 'HR Operations Assistant'
                                                : 'Employee Assistant'}
                                    </p>

                                </div>

                            </div>

                            <div className="hr-chatbot-header-actions">

                                <button
                                    type="button"
                                    onClick={
                                        clearChat
                                    }
                                    title="Clear conversation"
                                    aria-label="Clear conversation"
                                >
                                    <RotateCcw
                                        size={16}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsMinimized(
                                            (previous) =>
                                                !previous
                                        )
                                    }
                                    title={
                                        isMinimized
                                            ? 'Expand'
                                            : 'Minimize'
                                    }
                                    aria-label={
                                        isMinimized
                                            ? 'Expand'
                                            : 'Minimize'
                                    }
                                >
                                    <Minimize2
                                        size={16}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsOpen(
                                            false
                                        )
                                    }
                                    title="Close"
                                    aria-label="Close chatbot"
                                >
                                    <X
                                        size={18}
                                    />
                                </button>

                            </div>

                        </div>

                        {!isMinimized && (
                            <>

                                {/* =================================================
                                    SECURITY STRIP
                                ================================================== */}

                                <div className="hr-chatbot-security-strip">

                                    <span className="hr-chatbot-security-icon">

                                        <Sparkles
                                            size={13}
                                        />

                                    </span>

                                    <span>
                                        Connected to your HRMS
                                    </span>

                                    <span className="hr-chatbot-role-pill">
                                        {role}
                                    </span>

                                </div>

                                {/* =================================================
                                    MESSAGES
                                ================================================== */}

                                <div className="hr-chatbot-messages">

                                    {messages.map(
                                        (item) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className={`hr-chatbot-message-row ${item.sender ===
                                                        'user'
                                                        ? 'user'
                                                        : 'bot'
                                                    }`}
                                            >

                                                {/* BOT AVATAR */}

                                                {item.sender ===
                                                    'bot' && (
                                                        <div className="hr-chatbot-message-avatar">

                                                            <Bot
                                                                size={
                                                                    15
                                                                }
                                                                strokeWidth={
                                                                    2.3
                                                                }
                                                            />

                                                        </div>
                                                    )}

                                                <div className="hr-chatbot-message-content">

                                                    {/* WELCOME NAME */}

                                                    {item.type ===
                                                        'welcome' && (
                                                            <div className="hr-chatbot-welcome-name">
                                                                {getGreeting(
                                                                    role,
                                                                    userName
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* MESSAGE */}

                                                    <div
                                                        className={`hr-chatbot-bubble ${item.type ===
                                                                'info'
                                                                ? 'info'
                                                                : ''
                                                            } ${item.type ===
                                                                'leave-balance'
                                                                ? 'leave-balance'
                                                                : ''
                                                            }`}
                                                    >
                                                        {item.text}
                                                    </div>

                                                    {/* =================================================
                                                        LEAVE BALANCE CARDS
                                                    ================================================== */}

                                                    {item.type ===
                                                        'leave-balance' &&
                                                        Array.isArray(
                                                            item.data
                                                        ) &&
                                                        item
                                                            .data
                                                            .length >
                                                        0 && (
                                                            <div className="hr-chatbot-leave-cards">

                                                                {item.data.map(
                                                                    (
                                                                        balance,
                                                                        index
                                                                    ) => (
                                                                        <div
                                                                            className="hr-chatbot-leave-card"
                                                                            key={`${balance?.leaveType || 'leave'}-${index}`}
                                                                        >

                                                                            <div className="hr-chatbot-leave-card-top">

                                                                                <span>
                                                                                    {formatLeaveName(
                                                                                        balance?.leaveType
                                                                                    )}
                                                                                </span>

                                                                                <CalendarDays
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />

                                                                            </div>

                                                                            <div className="hr-chatbot-leave-card-number">

                                                                                {balance?.remaining ===
                                                                                    'Unlimited'
                                                                                    ? '∞'
                                                                                    : formatNumber(
                                                                                        balance?.remaining
                                                                                    )}

                                                                            </div>

                                                                            <div className="hr-chatbot-leave-card-label">

                                                                                {balance?.remaining ===
                                                                                    'Unlimited'
                                                                                    ? 'Unlimited'
                                                                                    : 'days remaining'}

                                                                            </div>

                                                                            {balance?.remaining !==
                                                                                'Unlimited' && (
                                                                                    <div className="hr-chatbot-leave-card-meta">

                                                                                        Used{' '}

                                                                                        {formatNumber(
                                                                                            balance?.used
                                                                                        )}

                                                                                        {' '}of{' '}

                                                                                        {formatNumber(
                                                                                            balance?.total
                                                                                        )}

                                                                                    </div>
                                                                                )}

                                                                        </div>
                                                                    )
                                                                )}

                                                            </div>
                                                        )}

                                                    <div className="hr-chatbot-message-time">

                                                        {formatTime(
                                                            item.time
                                                        )}

                                                    </div>

                                                </div>

                                                {/* USER AVATAR */}

                                                {item.sender ===
                                                    'user' && (
                                                        <div className="hr-chatbot-user-avatar">

                                                            {userName
                                                                ?.split(
                                                                    ' '
                                                                )
                                                                .map(
                                                                    (
                                                                        name
                                                                    ) =>
                                                                        name?.[0]
                                                                )
                                                                .join(
                                                                    ''
                                                                )
                                                                .slice(
                                                                    0,
                                                                    2
                                                                )
                                                                .toUpperCase() || (
                                                                    <UserRound
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                )}

                                                        </div>
                                                    )}

                                            </div>
                                        )
                                    )}

                                    {/* =================================================
                                        TYPING INDICATOR
                                    ================================================== */}

                                    {isTyping && (
                                        <div className="hr-chatbot-message-row bot">

                                            <div className="hr-chatbot-message-avatar">

                                                <Bot
                                                    size={
                                                        15
                                                    }
                                                    strokeWidth={
                                                        2.3
                                                    }
                                                />

                                            </div>

                                            <div className="hr-chatbot-typing">

                                                <span />
                                                <span />
                                                <span />

                                            </div>

                                        </div>
                                    )}

                                    <div
                                        ref={
                                            messagesEndRef
                                        }
                                    />

                                </div>

                                {/* =================================================
                                    QUICK ACTIONS
                                ================================================== */}

                                {messages.length <=
                                    1 && (
                                        <div className="hr-chatbot-quick-section">

                                            <div className="hr-chatbot-section-label">

                                                <span>
                                                    Quick actions
                                                </span>

                                            </div>

                                            <div className="hr-chatbot-quick-grid">

                                                {quickActions.map(
                                                    (
                                                        action
                                                    ) => {
                                                        const Icon =
                                                            action.icon;

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={
                                                                    action.label
                                                                }
                                                                onClick={() =>
                                                                    sendMessage(
                                                                        action.message
                                                                    )
                                                                }
                                                                disabled={
                                                                    isTyping
                                                                }
                                                                className="hr-chatbot-quick-card"
                                                            >

                                                                <span className="hr-chatbot-quick-icon">

                                                                    <Icon
                                                                        size={
                                                                            15
                                                                        }
                                                                    />

                                                                </span>

                                                                <span>
                                                                    {
                                                                        action.label
                                                                    }
                                                                </span>

                                                                <ChevronRight
                                                                    size={
                                                                        14
                                                                    }
                                                                    className="hr-chatbot-quick-arrow"
                                                                />

                                                            </button>
                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>
                                    )}

                                {/* =================================================
                                    INPUT
                                ================================================== */}

                                <div className="hr-chatbot-input-area">

                                    <div className="hr-chatbot-input-box">

                                        <textarea
                                            ref={
                                                inputRef
                                            }
                                            value={
                                                message
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setMessage(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            onKeyDown={
                                                handleKeyDown
                                            }
                                            placeholder="Ask anything about HR..."
                                            rows={1}
                                            maxLength={
                                                1000
                                            }
                                            disabled={
                                                isTyping
                                            }
                                        />

                                        <button
                                            type="button"
                                            className="hr-chatbot-send-button"
                                            onClick={() =>
                                                sendMessage()
                                            }
                                            disabled={
                                                !message.trim() ||
                                                isTyping
                                            }
                                            aria-label="Send message"
                                            title="Send message"
                                        >
                                            <Send
                                                size={
                                                    17
                                                }
                                                strokeWidth={
                                                    2.2
                                                }
                                            />
                                        </button>

                                    </div>

                                    <div className="hr-chatbot-input-footer">

                                        <span>
                                            Responses are powered by
                                            your HRMS data
                                        </span>

                                        <span>
                                            {
                                                message.length
                                            }
                                            /1000
                                        </span>

                                    </div>

                                </div>

                            </>
                        )}

                    </div>
                </div>
            )}
        </>
    );
}