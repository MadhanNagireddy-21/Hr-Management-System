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
    HelpCircle,
    ChevronRight,
    User,
    BookOpen,
    Calendar,
    Clock,
} from 'lucide-react';

import './HRChatbot.css';

// ============================================================
// API CONFIGURATION
// ============================================================
//
// Frontend and backend are both available on:
//
// https://hrms.saitejainfotechprivatelimited.com
//
// Therefore we use a relative URL.
//
// Final API request:
//
// https://hrms.saitejainfotechprivatelimited.com/api/chatbot/message
//
// DO NOT use:
// https://api.saitejainfotechprivatelimited.com
//
// ============================================================

const API_BASE_URL = '';

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
        {
            label: 'Job openings',
            icon: BriefcaseBusiness,
            message: 'Show me open job openings.',
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
    const role = String(user?.role || 'EMPLOYEE').toUpperCase();

    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'HR') return 'HR';

    return 'EMPLOYEE';
}

// ============================================================
// FIRST NAME
// ============================================================

function getFirstName(name) {
    if (!name) return 'there';

    return String(name).trim().split(/\s+/)[0];
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
// BACKEND RESPONSE FORMATTER
// ============================================================

function getBackendReply(response) {
    const data = response?.data?.data;

    if (typeof data?.reply === 'string') {
        const backendType = String(
            data?.type || ''
        ).toUpperCase();

        let type = 'normal';

        if (backendType === 'LEAVE_BALANCE') {
            type = 'leave-balance';
        } else if (
            backendType.includes('TRAINING') ||
            Array.isArray(data?.trainings)
        ) {
            type = 'training';
        } else if (
            backendType.includes('RECRUITMENT') ||
            backendType.includes('JOB') ||
            backendType.includes('REFERRAL') ||
            Array.isArray(data?.jobs) ||
            Array.isArray(data?.recruitmentApplications)
        ) {
            type = 'recruitment';
        }

        return {
            text: data.reply,
            type,
            data,
        };
    }

    if (typeof response?.data?.reply === 'string') {
        const backendType = String(
            response?.data?.type || ''
        ).toUpperCase();

        let type = 'normal';

        if (
            backendType.includes('TRAINING') ||
            Array.isArray(response?.data?.trainings)
        ) {
            type = 'training';
        } else if (
            backendType.includes('RECRUITMENT') ||
            backendType.includes('JOB') ||
            backendType.includes('REFERRAL') ||
            Array.isArray(response?.data?.jobs) ||
            Array.isArray(response?.data?.recruitmentApplications)
        ) {
            type = 'recruitment';
        }

        return {
            text: response.data.reply,
            type,
            data: response.data,
        };
    }

    if (typeof response?.data?.message === 'string') {
        return {
            text: response.data.message,
            type: 'normal',
            data: response.data,
        };
    }

    if (typeof response?.data === 'string') {
        return {
            text: response.data,
            type: 'normal',
            data: {},
        };
    }

    return {
        text:
            'I received a response from the HRMS server, but I could not understand the response format.',
        type: 'normal',
        data: response?.data || {},
    };
}

// ============================================================
// SAFE TEXT FORMATTER
// ============================================================

function formatText(text) {
    if (text === null || text === undefined) {
        return '';
    }

    return String(text);
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(value) {
    if (!value) return '';

    try {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return String(value);
    }
}

// ============================================================
// TIME FORMATTER
// ============================================================

function formatTime(value) {
    if (!value) return '';

    const stringValue = String(value);

    if (/^\d{1,2}:\d{2}/.test(stringValue)) {
        const parts = stringValue.split(':');

        const hour = Number(parts[0]);
        const minute = Number(parts[1]);

        if (
            Number.isFinite(hour) &&
            Number.isFinite(minute)
        ) {
            const date = new Date();

            date.setHours(hour);
            date.setMinutes(minute);
            date.setSeconds(0);

            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    }

    try {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    } catch {
        // Ignore invalid time
    }

    return stringValue;
}

// ============================================================
// NUMBER FORMATTER
// ============================================================

function formatNumber(value, decimals = 2) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '0';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return String(value);
    }

    return number.toFixed(decimals);
}

// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(status) {
    const normalized = String(
        status || ''
    ).toUpperCase();

    if (normalized.includes('PRESENT')) {
        return 'status-present';
    }

    if (normalized.includes('ABSENT')) {
        return 'status-absent';
    }

    if (
        normalized.includes('HALF') ||
        normalized.includes('PARTIAL')
    ) {
        return 'status-half';
    }

    if (
        normalized.includes('LEAVE') ||
        normalized.includes('APPROVED')
    ) {
        return 'status-leave';
    }

    if (
        normalized.includes('PENDING') ||
        normalized.includes('OPEN')
    ) {
        return 'status-pending';
    }

    if (
        normalized.includes('REJECT') ||
        normalized.includes('CANCEL')
    ) {
        return 'status-rejected';
    }

    return 'status-default';
}

// ============================================================
// DISPLAY STATUS
// ============================================================

function displayStatus(status) {
    if (!status) return 'N/A';

    return String(status)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

// ============================================================
// MESSAGE ID
// ============================================================

function createMessageId(prefix = 'msg') {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
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

    const [open, setOpen] = useState(false);

    const [minimized, setMinimized] =
        useState(false);

    const [input, setInput] = useState('');

    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    const [role, setRole] = useState(
        getRole(user)
    );

    const messagesEndRef = useRef(null);

    const inputRef = useRef(null);

    // ========================================================
    // USER INFORMATION
    // ========================================================

    const userName =
        user?.name ||
        user?.fullName ||
        user?.employeeName ||
        user?.username ||
        user?.firstName ||
        'there';

    // ========================================================
    // ROLE UPDATE
    // ========================================================

    useEffect(() => {
        setRole(getRole(user));
    }, [user]);

    // ========================================================
    // INITIAL MESSAGE
    // ========================================================

    useEffect(() => {
        if (!open) {
            return;
        }

        if (messages.length === 0) {
            setMessages([
                {
                    id: createMessageId('welcome'),
                    sender: 'bot',
                    text: getGreeting(
                        role,
                        userName
                    ),
                    type: 'greeting',
                    createdAt: new Date(),
                },
                {
                    id: createMessageId('welcome'),
                    sender: 'bot',
                    text: getWelcomeText(role),
                    type: 'normal',
                    createdAt: new Date(),
                },
            ]);
        }
    }, [
        open,
        role,
        userName,
        messages.length,
    ]);

    // ========================================================
    // SCROLL
    // ========================================================

    useEffect(() => {
        if (!open) return;

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages, loading, open]);

    // ========================================================
    // FOCUS
    // ========================================================

    useEffect(() => {
        if (!open || minimized) return;

        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 150);

        return () => clearTimeout(timeout);
    }, [open, minimized]);

    // ========================================================
    // THEME
    // ========================================================

    const themeClass =
        resolvedTheme === 'dark'
            ? 'hr-chatbot-dark'
            : 'hr-chatbot-light';

    // ========================================================
    // RESET
    // ========================================================

    const resetChat = () => {
        setMessages([
            {
                id: createMessageId('welcome'),
                sender: 'bot',
                text: getGreeting(
                    role,
                    userName
                ),
                type: 'greeting',
                createdAt: new Date(),
            },
            {
                id: createMessageId('welcome'),
                sender: 'bot',
                text: getWelcomeText(role),
                type: 'normal',
                createdAt: new Date(),
            },
        ]);

        setInput('');
        setError('');
        setLoading(false);
    };

    // ========================================================
    // GET ACCESS TOKEN
    // ========================================================

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
        ];

        // Check sessionStorage
        for (const key of possibleKeys) {
            const value =
                sessionStorage.getItem(key);

            if (value) {
                return value;
            }
        }

        // Check localStorage
        for (const key of possibleKeys) {
            const value =
                localStorage.getItem(key);

            if (value) {
                return value;
            }
        }

        return null;
    };

    // ========================================================
    // SEND MESSAGE
    // ========================================================

    const sendMessage = async (
        messageOverride = null
    ) => {
        const text = String(
            messageOverride !== null
                ? messageOverride
                : input
        ).trim();

        if (!text || loading) {
            return;
        }

        setError('');

        const userMessage = {
            id: createMessageId('user'),
            sender: 'user',
            text,
            type: 'normal',
            createdAt: new Date(),
        };

        setMessages((previous) => [
            ...previous,
            userMessage,
        ]);

        setInput('');
        setLoading(true);

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
                            'No active HRMS session was found. Please log in again.',
                    },
                };

                throw authError;
            }

            // ==================================================
            // API URL
            // ==================================================

            const apiUrl =
                '/api/chatbot/message';

            console.log(
                'HR Chatbot API URL:',
                apiUrl
            );

            // ==================================================
            // REQUEST
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
            // RESPONSE
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
                } catch (jsonError) {
                    console.error(
                        'HR Chatbot JSON parsing error:',
                        jsonError
                    );
                }
            } else {
                try {
                    const textResponse =
                        await response.text();

                    responseData =
                        textResponse
                            ? {
                                message:
                                    textResponse,
                            }
                            : null;
                } catch (textError) {
                    console.error(
                        'HR Chatbot response reading error:',
                        textError
                    );
                }
            }

            console.log(
                'HR Chatbot API Status:',
                response.status
            );

            console.log(
                'HR Chatbot API Response:',
                responseData
            );

            // ==================================================
            // HTTP ERROR
            // ==================================================

            if (!response.ok) {
                const serverMessage =
                    responseData?.message ||
                    responseData?.error ||
                    responseData?.data?.message ||
                    `Request failed with status ${response.status}`;

                const requestError =
                    new Error(
                        serverMessage
                    );

                requestError.response = {
                    status:
                        response.status,

                    data: responseData,
                };

                throw requestError;
            }

            // ==================================================
            // FORMAT RESPONSE
            // ==================================================

            const formatted =
                getBackendReply({
                    data: responseData,
                });

            // ==================================================
            // BOT MESSAGE
            // ==================================================

            setMessages(
                (previous) => [
                    ...previous,

                    {
                        id: createMessageId(
                            'bot'
                        ),

                        sender: 'bot',

                        text:
                            formatted.text ||
                            'I received an empty response from the HRMS server.',

                        type:
                            formatted.type ||
                            'normal',

                        data:
                            formatted.data ||
                            {},

                        createdAt:
                            new Date(),
                    },
                ]
            );
        } catch (err) {
            console.error(
                'HR Chatbot API Error:',
                err
            );

            let errorMessage =
                'Something went wrong while contacting the HR Assistant.';

            if (
                err?.response?.status ===
                401
            ) {
                errorMessage =
                    'Your HRMS session has expired. Please log in again.';
            } else if (
                err?.response?.status ===
                403
            ) {
                errorMessage =
                    'You do not have permission to access this HRMS information.';
            } else if (
                err?.response?.status ===
                404
            ) {
                errorMessage =
                    'The HR Assistant API endpoint was not found on the live server.';
            } else if (
                err?.response?.status >=
                500
            ) {
                errorMessage =
                    'The HRMS server encountered an error while processing your request. Please try again.';
            } else if (
                String(
                    err?.message || ''
                )
                    .toLowerCase()
                    .includes(
                        'failed to fetch'
                    )
            ) {
                errorMessage =
                    'Unable to connect to the HRMS server. Please check the live server connection.';
            } else if (
                err?.message
            ) {
                errorMessage =
                    err.message;
            }

            setError(
                errorMessage
            );

            setMessages(
                (previous) => [
                    ...previous,

                    {
                        id: createMessageId(
                            'error'
                        ),

                        sender: 'bot',

                        text:
                            errorMessage,

                        type: 'error',

                        createdAt:
                            new Date(),
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // ENTER KEY
    // ========================================================

    const handleKeyDown = (event) => {
        if (event.key !== 'Enter') {
            return;
        }

        if (event.shiftKey) {
            return;
        }

        event.preventDefault();

        sendMessage();
    };

    // ========================================================
    // QUICK ACTION
    // ========================================================

    const handleQuickAction = (
        message
    ) => {
        sendMessage(message);
    };

    // ========================================================
    // RENDER MESSAGE TEXT
    // ========================================================

    const renderMessageText = (
        text
    ) => {
        if (!text) {
            return null;
        }

        const lines =
            String(text).split('\n');

        return lines.map(
            (line, index) => {
                const trimmed =
                    line.trim();

                if (!trimmed) {
                    return (
                        <div
                            key={index}
                            className="hr-chatbot-text-spacer"
                        />
                    );
                }

                const parts =
                    trimmed.split(
                        /(\*\*.*?\*\*)/
                    );

                return (
                    <div
                        key={index}
                        className="hr-chatbot-text-line"
                    >
                        {parts.map(
                            (
                                part,
                                partIndex
                            ) => {
                                if (
                                    part.startsWith(
                                        '**'
                                    ) &&
                                    part.endsWith(
                                        '**'
                                    )
                                ) {
                                    return (
                                        <strong
                                            key={
                                                partIndex
                                            }
                                        >
                                            {part.slice(
                                                2,
                                                -2
                                            )}
                                        </strong>
                                    );
                                }

                                return (
                                    <span
                                        key={
                                            partIndex
                                        }
                                    >
                                        {part}
                                    </span>
                                );
                            }
                        )}
                    </div>
                );
            }
        );
    };

    // ========================================================
    // MESSAGE
    // ========================================================

    const renderMessage = (
        message
    ) => {
        const isUser =
            message.sender ===
            'user';

        return (
            <div
                className={`hr-chatbot-message-row ${isUser
                        ? 'hr-chatbot-message-user'
                        : 'hr-chatbot-message-bot'
                    }`}
                key={message.id}
            >
                {!isUser && (
                    <div className="hr-chatbot-avatar bot-avatar">
                        <Bot size={17} />
                    </div>
                )}

                <div
                    className={`hr-chatbot-message ${isUser
                            ? 'user-message'
                            : 'bot-message'
                        } ${message.type ===
                            'error'
                            ? 'error-message'
                            : ''
                        }`}
                >
                    <div className="hr-chatbot-message-content">
                        {renderMessageText(
                            formatText(
                                message.text
                            )
                        )}
                    </div>

                    {message.createdAt && (
                        <div className="hr-chatbot-message-time">
                            {new Date(
                                message.createdAt
                            ).toLocaleTimeString(
                                'en-IN',
                                {
                                    hour:
                                        '2-digit',
                                    minute:
                                        '2-digit',
                                }
                            )}
                        </div>
                    )}
                </div>

                {isUser && (
                    <div className="hr-chatbot-avatar user-avatar">
                        <UserRound
                            size={17}
                        />
                    </div>
                )}
            </div>
        );
    };

    // ========================================================
    // TYPING
    // ========================================================

    const renderTyping = () => (
        <div className="hr-chatbot-message-row hr-chatbot-message-bot">
            <div className="hr-chatbot-avatar bot-avatar">
                <Bot size={17} />
            </div>

            <div className="hr-chatbot-message bot-message typing-message">
                <div className="hr-chatbot-typing">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        </div>
    );

    // ========================================================
    // QUICK ACTION BUTTON
    // ========================================================

    const quickActions =
        QUICK_ACTIONS[role] ||
        QUICK_ACTIONS.EMPLOYEE;

    const renderQuickAction = (
        action
    ) => {
        const Icon =
            action.icon ||
            HelpCircle;

        return (
            <button
                type="button"
                className="hr-chatbot-quick-action"
                key={action.label}
                onClick={() =>
                    handleQuickAction(
                        action.message
                    )
                }
                disabled={loading}
            >
                <Icon size={16} />

                <span>
                    {action.label}
                </span>

                <ChevronRight
                    size={14}
                />
            </button>
        );
    };

    // ========================================================
    // CLOSED
    // ========================================================

    if (!open) {
        return (
            <button
                type="button"
                className="hr-chatbot-launcher"
                onClick={() =>
                    setOpen(true)
                }
                aria-label="Open HR Assistant"
            >
                <div className="hr-chatbot-launcher-icon">
                    <Bot size={25} />

                    <span className="hr-chatbot-online-dot" />
                </div>

                <div className="hr-chatbot-launcher-text">
                    <strong>
                        HR Assistant
                    </strong>

                    <span>
                        Ask HRMS AI
                    </span>
                </div>
            </button>
        );
    }

    // ========================================================
    // MINIMIZED
    // ========================================================

    if (minimized) {
        return (
            <div
                className={`hr-chatbot-minimized ${themeClass}`}
            >
                <button
                    type="button"
                    onClick={() =>
                        setMinimized(false)
                    }
                    className="hr-chatbot-minimized-main"
                >
                    <Bot size={20} />

                    <span>
                        HR Assistant
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setOpen(false)
                    }
                    className="hr-chatbot-minimized-close"
                    aria-label="Close HR Assistant"
                >
                    <X size={17} />
                </button>
            </div>
        );
    }

    // ========================================================
    // FULL UI
    // ========================================================

    return (
        <div
            className={`hr-chatbot-container ${themeClass}`}
        >
            <div className="hr-chatbot-window">

                {/* HEADER */}

                <div className="hr-chatbot-header">
                    <div className="hr-chatbot-header-left">

                        <div className="hr-chatbot-header-avatar">
                            <Bot size={22} />

                            <span className="hr-chatbot-online-dot" />
                        </div>

                        <div className="hr-chatbot-header-info">

                            <div className="hr-chatbot-header-title">
                                <strong>
                                    HR Assistant
                                </strong>

                                <Sparkles
                                    size={14}
                                />
                            </div>

                            <span>
                                {role ===
                                    'ADMIN'
                                    ? 'Admin Assistant'
                                    : role ===
                                        'HR'
                                        ? 'HR Assistant'
                                        : 'Employee Assistant'}
                            </span>

                        </div>
                    </div>

                    <div className="hr-chatbot-header-actions">

                        <button
                            type="button"
                            onClick={
                                resetChat
                            }
                            aria-label="Reset chat"
                            title="Reset chat"
                        >
                            <RotateCcw
                                size={17}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setMinimized(
                                    true
                                )
                            }
                            aria-label="Minimize"
                            title="Minimize"
                        >
                            <Minimize2
                                size={18}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setOpen(
                                    false
                                )
                            }
                            aria-label="Close"
                            title="Close"
                        >
                            <X size={19} />
                        </button>

                    </div>
                </div>

                {/* CONNECTION */}

                <div className="hr-chatbot-connection">
                    <span className="hr-chatbot-connection-dot" />

                    <span>
                        Connected to your HRMS
                    </span>

                    <span className="hr-chatbot-role-badge">
                        {role}
                    </span>
                </div>

                {/* MESSAGES */}

                <div className="hr-chatbot-messages">

                    {messages.map(
                        renderMessage
                    )}

                    {loading &&
                        renderTyping()}

                    <div
                        ref={
                            messagesEndRef
                        }
                    />

                </div>

                {/* QUICK ACTIONS */}

                {messages.length <=
                    2 &&
                    !loading && (
                        <div className="hr-chatbot-quick-actions">

                            <div className="hr-chatbot-quick-title">
                                <Sparkles
                                    size={14}
                                />

                                <span>
                                    Quick actions
                                </span>
                            </div>

                            <div className="hr-chatbot-quick-grid">
                                {quickActions.map(
                                    renderQuickAction
                                )}
                            </div>

                        </div>
                    )}

                {/* ERROR */}

                {error && (
                    <div className="hr-chatbot-error-banner">

                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setError(
                                    ''
                                )
                            }
                        >
                            <X size={14} />
                        </button>

                    </div>
                )}

                {/* INPUT */}

                <div className="hr-chatbot-input-area">

                    <div className="hr-chatbot-input-wrapper">

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(event) =>
                                setInput(
                                    event.target
                                        .value
                                )
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            placeholder={
                                role ===
                                    'EMPLOYEE'
                                    ? 'Ask about your attendance, leave, payslip...'
                                    : 'Ask about employees, attendance, leave, recruitment...'
                            }
                            rows={1}
                            disabled={loading}
                            aria-label="Ask HR Assistant"
                            id="hr-chatbot-message"
                            name="hrChatbotMessage"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                sendMessage()
                            }
                            disabled={
                                loading ||
                                !input.trim()
                            }
                            className="hr-chatbot-send"
                            aria-label="Send message"
                            title="Send"
                        >
                            <Send
                                size={18}
                            />
                        </button>

                    </div>

                    <div className="hr-chatbot-input-hint">
                        <span>
                            Press Enter to send
                        </span>

                        <span>
                            HRMS AI
                        </span>
                    </div>

                </div>

            </div>
        </div>
    );
}