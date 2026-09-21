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

/* ============================================================
   API CONFIGURATION
   ============================================================

   Backend and frontend are on the same live domain:

   https://hrms.saitejainfotechprivatelimited.com

   Therefore we use a relative URL by default.

   This means the request becomes:

   /api/chatbot/message

   which the live server should forward to Spring Boot.

   If you ever need another API URL, you can set:

   NEXT_PUBLIC_API_URL

   ============================================================ */

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || '';

/* ============================================================
   QUICK ACTIONS
   ============================================================ */

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

/* ============================================================
   ROLE
   ============================================================ */

function getRole(user) {
    const role = String(
        user?.role ||
        user?.userRole ||
        user?.roles?.[0] ||
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

/* ============================================================
   FIRST NAME
   ============================================================ */

function getFirstName(name) {
    if (!name) {
        return 'there';
    }

    return String(name)
        .trim()
        .split(/\s+/)[0];
}

/* ============================================================
   GREETING
   ============================================================ */

function getGreeting(role, name) {
    const firstName = getFirstName(name);

    return `Hello ${firstName} 👋`;
}

/* ============================================================
   WELCOME TEXT
   ============================================================ */

function getWelcomeText(role) {
    if (role === 'ADMIN') {
        return 'I’m your HRMS AI Assistant. I can help you understand workforce, attendance, recruitment, training and other HR information.';
    }

    if (role === 'HR') {
        return 'I’m your HRMS AI Assistant. I can help you with employees, leave requests, recruitment, training and HR operations.';
    }

    return 'I’m your HRMS AI Assistant. I can help you with your leave, attendance, payslip, training and HRMS information.';
}

/* ============================================================
   BACKEND RESPONSE FORMATTER
   ============================================================ */

function getBackendReply(response) {
    const root = response?.data;

    const data =
        root?.data &&
        typeof root.data === 'object'
            ? root.data
            : root;

    if (typeof data?.reply === 'string') {
        const backendType = String(
            data?.type || ''
        ).toUpperCase();

        let type = 'normal';

        if (
            backendType.includes('LEAVE') ||
            Array.isArray(data?.leaveBalances) ||
            Array.isArray(data?.balances)
        ) {
            type = 'leave-balance';
        }

        if (
            backendType.includes('TRAINING') ||
            Array.isArray(data?.trainings)
        ) {
            type = 'training';
        }

        if (
            backendType.includes('RECRUITMENT') ||
            backendType.includes('JOB') ||
            backendType.includes('REFERRAL') ||
            Array.isArray(data?.jobs) ||
            Array.isArray(data?.recruitmentApplications)
        ) {
            type = 'recruitment';
        }

        if (
            backendType.includes('ATTENDANCE') ||
            data?.attendance ||
            data?.attendanceRecord ||
            data?.monthlyStats ||
            data?.attendanceStats ||
            Array.isArray(data?.monthlyRecords) ||
            Array.isArray(data?.weeklyRecords)
        ) {
            type = 'attendance';
        }

        return {
            text: data.reply,
            type,
            data,
        };
    }

    if (typeof root?.reply === 'string') {
        return {
            text: root.reply,
            type: 'normal',
            data: root,
        };
    }

    if (typeof root?.message === 'string') {
        return {
            text: root.message,
            type: 'normal',
            data: root,
        };
    }

    if (typeof root === 'string') {
        return {
            text: root,
            type: 'normal',
            data: {},
        };
    }

    return {
        text:
            'I received a response from the HRMS server, but I could not understand the response format.',
        type: 'normal',
        data: root || {},
    };
}

/* ============================================================
   TEXT FORMATTER
   ============================================================ */

function formatText(text) {
    if (
        text === null ||
        text === undefined
    ) {
        return '';
    }

    return String(text);
}

/* ============================================================
   DATE FORMATTER
   ============================================================ */

function formatDate(value) {
    if (!value) {
        return '';
    }

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

/* ============================================================
   TIME FORMATTER
   ============================================================ */

function formatTime(value) {
    if (!value) {
        return '';
    }

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
        // Ignore invalid date
    }

    return stringValue;
}

/* ============================================================
   NUMBER FORMATTER
   ============================================================ */

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

/* ============================================================
   STATUS CLASS
   ============================================================ */

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

/* ============================================================
   DISPLAY STATUS
   ============================================================ */

function displayStatus(status) {
    if (!status) {
        return 'N/A';
    }

    return String(status)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

/* ============================================================
   MESSAGE ID
   ============================================================ */

function createMessageId(prefix = 'msg') {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

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

    const [messages, setMessages] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const [role, setRole] =
        useState(getRole(user));

    const messagesEndRef =
        useRef(null);

    const inputRef =
        useRef(null);

    /* ========================================================
       USER INFORMATION
       ======================================================== */

    const userName =
        user?.name ||
        user?.fullName ||
        user?.employeeName ||
        user?.username ||
        user?.firstName ||
        'there';

    /* ========================================================
       ROLE UPDATE
       ======================================================== */

    useEffect(() => {
        setRole(getRole(user));
    }, [user]);

    /* ========================================================
       INITIAL MESSAGE
       ======================================================== */

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

    /* ========================================================
       SCROLL TO BOTTOM
       ======================================================== */

    useEffect(() => {
        if (!open) {
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [
        messages,
        loading,
        open,
    ]);

    /* ========================================================
       FOCUS INPUT
       ======================================================== */

    useEffect(() => {
        if (
            !open ||
            minimized
        ) {
            return;
        }

        const timeout =
            setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

        return () =>
            clearTimeout(timeout);
    }, [
        open,
        minimized,
    ]);

    /* ========================================================
       THEME
       ======================================================== */

    const themeClass =
        resolvedTheme === 'dark'
            ? 'hr-chatbot-dark'
            : 'hr-chatbot-light';

    /* ========================================================
       RESET CHAT
       ======================================================== */

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

    /* ========================================================
       GET ACCESS TOKEN
       ======================================================== */

    const getAccessToken = () => {
        if (
            typeof window ===
            'undefined'
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

        /* Session storage first */

        for (const key of possibleKeys) {
            try {
                const value =
                    sessionStorage.getItem(
                        key
                    );

                if (value) {
                    return value;
                }
            } catch {
                // Ignore storage errors
            }
        }

        /* Local storage */

        for (const key of possibleKeys) {
            try {
                const value =
                    localStorage.getItem(
                        key
                    );

                if (value) {
                    return value;
                }
            } catch {
                // Ignore storage errors
            }
        }

        return null;
    };

    /* ========================================================
       SEND MESSAGE
       ======================================================== */

    const sendMessage = async (
        messageOverride = null
    ) => {
        const text = String(
            messageOverride !== null
                ? messageOverride
                : input
        ).trim();

        if (
            !text ||
            loading
        ) {
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

        setMessages(
            (previous) => [
                ...previous,
                userMessage,
            ]
        );

        setInput('');
        setLoading(true);

        try {
            /* ================================================
               AUTH TOKEN
               ================================================ */

            const accessToken =
                getAccessToken();

            if (!accessToken) {
                throw new Error(
                    'Your HRMS session is not available. Please log in again.'
                );
            }

            /* ================================================
               API URL

               IMPORTANT:

               We DO NOT use:

               https://api.saitejainfotechprivatelimited.com

               anymore.

               Because your backend is on:

               https://hrms.saitejainfotechprivatelimited.com

               ================================================ */

            const apiUrl =
                `${API_BASE_URL}/api/chatbot/message`;

            console.log(
                'HRMS Chatbot API:',
                apiUrl
            );

            /* ================================================
               API REQUEST
               ================================================ */

            const response =
                await fetch(
                    apiUrl,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Accept:
                                'application/json',

                            Authorization:
                                `Bearer ${accessToken}`,
                        },

                        body:
                            JSON.stringify({
                                message: text,
                            }),
                    }
                );

            /* ================================================
               READ RESPONSE
               ================================================ */

            let responseData =
                null;

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
                        textResponse;
                } catch {
                    responseData =
                        null;
                }
            }

            /* ================================================
               HTTP ERROR
               ================================================ */

            if (!response.ok) {
                const serverMessage =
                    responseData?.message ||
                    responseData?.error ||
                    responseData?.data?.message ||
                    (
                        typeof responseData ===
                        'string'
                            ? responseData
                            : `Request failed with status ${response.status}`
                    );

                const requestError =
                    new Error(
                        serverMessage
                    );

                requestError.status =
                    response.status;

                requestError.response = {
                    status:
                        response.status,

                    data:
                        responseData,
                };

                throw requestError;
            }

            /* ================================================
               FORMAT BACKEND RESPONSE
               ================================================ */

            const formatted =
                getBackendReply({
                    data:
                        responseData,
                });

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

            const status =
                err?.response
                    ?.status ||
                err?.status;

            if (
                status === 401
            ) {
                errorMessage =
                    'Your HRMS session has expired. Please log in again.';
            } else if (
                status === 403
            ) {
                errorMessage =
                    'You do not have permission to access this HRMS information.';
            } else if (
                status === 404
            ) {
                errorMessage =
                    'The HR Assistant API endpoint was not found. Please check /api/chatbot/message on the live server.';
            } else if (
                status >= 500
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
                    'Unable to connect to the HRMS API server. Please check the live backend connection.';
            } else if (
                String(
                    err?.message || ''
                )
                    .toLowerCase()
                    .includes(
                        'network'
                    )
            ) {
                errorMessage =
                    'Network error while connecting to the HRMS API server.';
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

    /* ========================================================
       ENTER KEY
       ======================================================== */

    const handleKeyDown = (
        event
    ) => {
        if (
            event.key !==
            'Enter'
        ) {
            return;
        }

        if (
            event.shiftKey
        ) {
            return;
        }

        event.preventDefault();

        sendMessage();
    };

    /* ========================================================
       QUICK ACTION
       ======================================================== */

    const handleQuickAction = (
        message
    ) => {
        sendMessage(message);
    };

    /* ========================================================
       RENDER MESSAGE TEXT
       ======================================================== */

    const renderMessageText = (
        text
    ) => {
        if (!text) {
            return null;
        }

        const lines =
            String(text).split(
                '\n'
            );

        return lines.map(
            (
                line,
                index
            ) => {
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

    /* ========================================================
       LEAVE BALANCE CARD
       ======================================================== */

    const renderLeaveBalance =
        (data) => {
            const balances =
                Array.isArray(
                    data?.leaveBalances
                )
                    ? data.leaveBalances
                    : Array.isArray(
                          data?.balances
                      )
                    ? data.balances
                    : [];

            if (
                balances.length ===
                0
            ) {
                return null;
            }

            return (
                <div className="hr-chatbot-card hr-chatbot-leave-card">
                    <div className="hr-chatbot-card-title">
                        <CalendarDays
                            size={18}
                        />

                        <span>
                            Leave Balance
                        </span>
                    </div>

                    <div className="hr-chatbot-balance-grid">
                        {balances.map(
                            (
                                balance,
                                index
                            ) => {
                                const name =
                                    balance?.leaveType ||
                                    balance?.type ||
                                    balance?.name ||
                                    `Leave ${
                                        index +
                                        1
                                    }`;

                                const value =
                                    balance?.balance ??
                                    balance?.remaining ??
                                    balance?.available ??
                                    balance?.days ??
                                    0;

                                return (
                                    <div
                                        className="hr-chatbot-balance-item"
                                        key={
                                            balance?.id ||
                                            `${name}-${index}`
                                        }
                                    >
                                        <span>
                                            {
                                                name
                                            }
                                        </span>

                                        <strong>
                                            {
                                                value
                                            }
                                        </strong>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            );
        };

    /* ========================================================
       TRAINING CARD
       ======================================================== */

    const renderTrainingCard =
        (data) => {
            const trainings =
                Array.isArray(
                    data?.trainings
                )
                    ? data.trainings
                    : [];

            if (
                trainings.length ===
                0
            ) {
                return null;
            }

            return (
                <div className="hr-chatbot-card hr-chatbot-training-card">
                    <div className="hr-chatbot-card-title">
                        <GraduationCap
                            size={18}
                        />

                        <span>
                            Training
                        </span>
                    </div>

                    <div className="hr-chatbot-training-list">
                        {trainings.map(
                            (
                                training,
                                index
                            ) => {
                                const title =
                                    training?.title ||
                                    training?.trainingName ||
                                    training?.name ||
                                    'Training';

                                const status =
                                    training?.status ||
                                    training?.enrollmentStatus ||
                                    '';

                                return (
                                    <div
                                        className="hr-chatbot-training-item"
                                        key={
                                            training?.id ||
                                            index
                                        }
                                    >
                                        <div className="hr-chatbot-training-icon">
                                            <BookOpen
                                                size={
                                                    16
                                                }
                                            />
                                        </div>

                                        <div className="hr-chatbot-training-content">
                                            <strong>
                                                {
                                                    title
                                                }
                                            </strong>

                                            {status && (
                                                <span
                                                    className={`hr-chatbot-status ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {displayStatus(
                                                        status
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            );
        };

    /* ========================================================
       RECRUITMENT CARD
       ======================================================== */

    const renderRecruitmentCard =
        (data) => {
            const jobs =
                Array.isArray(
                    data?.jobs
                )
                    ? data.jobs
                    : [];

            const applications =
                Array.isArray(
                    data?.recruitmentApplications
                )
                    ? data.recruitmentApplications
                    : [];

            if (
                jobs.length === 0 &&
                applications.length === 0
            ) {
                return null;
            }

            return (
                <div className="hr-chatbot-card hr-chatbot-recruitment-card">
                    <div className="hr-chatbot-card-title">
                        <BriefcaseBusiness
                            size={18}
                        />

                        <span>
                            Recruitment
                        </span>
                    </div>

                    {jobs.length >
                        0 && (
                        <div className="hr-chatbot-job-list">
                            {jobs.map(
                                (
                                    job,
                                    index
                                ) => {
                                    const title =
                                        job?.title ||
                                        job?.jobTitle ||
                                        job?.position ||
                                        'Open Position';

                                    const department =
                                        job?.department ||
                                        job?.departmentName ||
                                        '';

                                    const status =
                                        job?.status ||
                                        '';

                                    return (
                                        <div
                                            className="hr-chatbot-job-item"
                                            key={
                                                job?.id ||
                                                index
                                            }
                                        >
                                            <div className="hr-chatbot-job-icon">
                                                <BriefcaseBusiness
                                                    size={
                                                        16
                                                    }
                                                />
                                            </div>

                                            <div className="hr-chatbot-job-content">
                                                <strong>
                                                    {
                                                        title
                                                    }
                                                </strong>

                                                {department && (
                                                    <span>
                                                        {
                                                            department
                                                        }
                                                    </span>
                                                )}

                                                {status && (
                                                    <span
                                                        className={`hr-chatbot-status ${getStatusClass(
                                                            status
                                                        )}`}
                                                    >
                                                        {displayStatus(
                                                            status
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}

                    {applications.length >
                        0 && (
                        <div className="hr-chatbot-application-list">
                            {applications.map(
                                (
                                    application,
                                    index
                                ) => {
                                    const name =
                                        application?.candidateName ||
                                        application?.name ||
                                        application?.applicantName ||
                                        'Candidate';

                                    const status =
                                        application?.status ||
                                        '';

                                    return (
                                        <div
                                            className="hr-chatbot-application-item"
                                            key={
                                                application?.id ||
                                                index
                                            }
                                        >
                                            <User
                                                size={
                                                    16
                                                }
                                            />

                                            <div>
                                                <strong>
                                                    {
                                                        name
                                                    }
                                                </strong>

                                                {status && (
                                                    <span
                                                        className={`hr-chatbot-status ${getStatusClass(
                                                            status
                                                        )}`}
                                                    >
                                                        {displayStatus(
                                                            status
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            );
        };

    /* ========================================================
       ATTENDANCE CARD
       ======================================================== */

    const renderAttendanceCard =
        (data) => {
            if (!data) {
                return null;
            }

            const attendance =
                data?.attendance ||
                data?.attendanceRecord ||
                data?.record ||
                null;

            if (!attendance) {
                return null;
            }

            const status =
                attendance?.status ||
                data?.status ||
                '';

            const date =
                attendance?.date ||
                data?.date ||
                '';

            const checkIn =
                attendance?.checkIn ||
                data?.checkIn ||
                '';

            const checkOut =
                attendance?.checkOut ||
                data?.checkOut ||
                '';

            const workHours =
                attendance?.workHours ??
                data?.workHours ??
                null;

            return (
                <div className="hr-chatbot-card hr-chatbot-attendance-card">
                    <div className="hr-chatbot-card-title">
                        <Clock3
                            size={18}
                        />

                        <span>
                            Attendance
                        </span>
                    </div>

                    <div className="hr-chatbot-attendance-grid">
                        {date && (
                            <div>
                                <span>
                                    Date
                                </span>

                                <strong>
                                    {formatDate(
                                        date
                                    )}
                                </strong>
                            </div>
                        )}

                        {status && (
                            <div>
                                <span>
                                    Status
                                </span>

                                <strong
                                    className={`hr-chatbot-status ${getStatusClass(
                                        status
                                    )}`}
                                >
                                    {displayStatus(
                                        status
                                    )}
                                </strong>
                            </div>
                        )}

                        {checkIn && (
                            <div>
                                <span>
                                    Check In
                                </span>

                                <strong>
                                    {formatTime(
                                        checkIn
                                    )}
                                </strong>
                            </div>
                        )}

                        {checkOut && (
                            <div>
                                <span>
                                    Check Out
                                </span>

                                <strong>
                                    {formatTime(
                                        checkOut
                                    )}
                                </strong>
                            </div>
                        )}

                        {workHours !==
                            null && (
                            <div>
                                <span>
                                    Work Hours
                                </span>

                                <strong>
                                    {formatNumber(
                                        workHours
                                    )}
                                </strong>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

    /* ========================================================
       MONTHLY ATTENDANCE
       ======================================================== */

    const renderMonthlyAttendance =
        (data) => {
            const stats =
                data?.monthlyStats ||
                data?.attendanceStats ||
                data?.stats ||
                null;

            if (!stats) {
                return null;
            }

            const hasStats =
                stats?.presentCount !==
                    undefined ||
                stats?.absentCount !==
                    undefined ||
                stats?.halfDayCount !==
                    undefined ||
                stats?.leaveCount !==
                    undefined ||
                stats?.attendancePercent !==
                    undefined ||
                stats?.totalWorkHours !==
                    undefined;

            if (!hasStats) {
                return null;
            }

            const percentage =
                Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            stats.attendancePercent
                        ) || 0
                    )
                );

            return (
                <div className="hr-chatbot-card hr-chatbot-monthly-card">
                    <div className="hr-chatbot-card-title">
                        <Calendar
                            size={18}
                        />

                        <span>
                            Attendance Summary
                        </span>
                    </div>

                    <div className="hr-chatbot-stats-grid">
                        <div className="hr-chatbot-stat">
                            <span>
                                Present
                            </span>

                            <strong>
                                {
                                    stats?.presentCount ??
                                    0
                                }
                            </strong>
                        </div>

                        <div className="hr-chatbot-stat">
                            <span>
                                Absent
                            </span>

                            <strong>
                                {
                                    stats?.absentCount ??
                                    0
                                }
                            </strong>
                        </div>

                        <div className="hr-chatbot-stat">
                            <span>
                                Half Day
                            </span>

                            <strong>
                                {
                                    stats?.halfDayCount ??
                                    0
                                }
                            </strong>
                        </div>

                        <div className="hr-chatbot-stat">
                            <span>
                                Leave
                            </span>

                            <strong>
                                {
                                    stats?.leaveCount ??
                                    0
                                }
                            </strong>
                        </div>
                    </div>

                    {stats?.attendancePercent !==
                        undefined && (
                        <div className="hr-chatbot-percentage">
                            <div>
                                <span>
                                    Attendance
                                </span>

                                <strong>
                                    {formatNumber(
                                        stats.attendancePercent
                                    )}
                                    %
                                </strong>
                            </div>

                            <div className="hr-chatbot-progress">
                                <div
                                    className="hr-chatbot-progress-bar"
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {stats?.totalWorkHours !==
                        undefined && (
                        <div className="hr-chatbot-work-hours">
                            <Clock
                                size={15}
                            />

                            <span>
                                Total work hours:{' '}
                                <strong>
                                    {formatNumber(
                                        stats.totalWorkHours
                                    )}
                                </strong>
                            </span>
                        </div>
                    )}
                </div>
            );
        };

    /* ========================================================
       DAILY RECORDS
       ======================================================== */

    const renderDailyRecords =
        (data) => {
            const records =
                Array.isArray(
                    data?.monthlyRecords
                )
                    ? data.monthlyRecords
                    : Array.isArray(
                          data?.weeklyRecords
                      )
                    ? data.weeklyRecords
                    : Array.isArray(
                          data?.records
                      )
                    ? data.records
                    : [];

            if (
                records.length ===
                0
            ) {
                return null;
            }

            return (
                <div className="hr-chatbot-card hr-chatbot-records-card">
                    <div className="hr-chatbot-card-title">
                        <CalendarDays
                            size={18}
                        />

                        <span>
                            Attendance Records
                        </span>
                    </div>

                    <div className="hr-chatbot-records-list">
                        {records.map(
                            (
                                record,
                                index
                            ) => (
                                <div
                                    className="hr-chatbot-record-item"
                                    key={
                                        record?.date ||
                                        index
                                    }
                                >
                                    <div className="hr-chatbot-record-date">
                                        <strong>
                                            {formatDate(
                                                record?.date
                                            )}
                                        </strong>

                                        {record?.dayName && (
                                            <span>
                                                {
                                                    record.dayName
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <div className="hr-chatbot-record-status">
                                        <span
                                            className={`hr-chatbot-status ${getStatusClass(
                                                record?.status
                                            )}`}
                                        >
                                            {displayStatus(
                                                record?.status
                                            )}
                                        </span>
                                    </div>

                                    <div className="hr-chatbot-record-time">
                                        {record?.checkIn && (
                                            <span>
                                                In:{' '}
                                                {formatTime(
                                                    record.checkIn
                                                )}
                                            </span>
                                        )}

                                        {record?.checkOut && (
                                            <span>
                                                Out:{' '}
                                                {formatTime(
                                                    record.checkOut
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            );
        };

    /* ========================================================
       DATA CARDS
       ======================================================== */

    const renderDataCards = (
        message
    ) => {
        const data =
            message?.data;

        if (!data) {
            return null;
        }

        return (
            <>
                {message.type ===
                    'leave-balance' &&
                    renderLeaveBalance(
                        data
                    )}

                {message.type ===
                    'training' &&
                    renderTrainingCard(
                        data
                    )}

                {message.type ===
                    'recruitment' &&
                    renderRecruitmentCard(
                        data
                    )}

                {message.type ===
                    'attendance' &&
                    renderAttendanceCard(
                        data
                    )}

                {renderAttendanceCard(
                    data
                )}

                {renderMonthlyAttendance(
                    data
                )}

                {renderDailyRecords(
                    data
                )}
            </>
        );
    };

    /* ========================================================
       MESSAGE COMPONENT
       ======================================================== */

    const renderMessage = (
        message
    ) => {
        const isUser =
            message.sender ===
            'user';

        return (
            <div
                className={`hr-chatbot-message-row ${
                    isUser
                        ? 'hr-chatbot-message-user'
                        : 'hr-chatbot-message-bot'
                }`}
                key={
                    message.id
                }
            >
                {!isUser && (
                    <div className="hr-chatbot-avatar bot-avatar">
                        <Bot
                            size={17}
                        />
                    </div>
                )}

                <div
                    className={`hr-chatbot-message ${
                        isUser
                            ? 'user-message'
                            : 'bot-message'
                    } ${
                        message.type ===
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

                        {!isUser &&
                            renderDataCards(
                                message
                            )}
                    </div>

                    {message.createdAt && (
                        <div className="hr-chatbot-message-time">
                            {new Date(
                                message.createdAt
                            ).toLocaleTimeString(
                                'en-IN',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
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

    /* ========================================================
       TYPING
       ======================================================== */

    const renderTyping =
        () => (
            <div className="hr-chatbot-message-row hr-chatbot-message-bot">
                <div className="hr-chatbot-avatar bot-avatar">
                    <Bot
                        size={17}
                    />
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

    /* ========================================================
       QUICK ACTION
       ======================================================== */

    const renderQuickAction =
        (action) => {
            const Icon =
                action.icon ||
                HelpCircle;

            return (
                <button
                    type="button"
                    className="hr-chatbot-quick-action"
                    key={
                        action.label
                    }
                    onClick={() =>
                        handleQuickAction(
                            action.message
                        )
                    }
                    disabled={
                        loading
                    }
                >
                    <Icon
                        size={16}
                    />

                    <span>
                        {
                            action.label
                        }
                    </span>

                    <ChevronRight
                        size={14}
                    />
                </button>
            );
        };

    const quickActions =
        QUICK_ACTIONS[
            role
        ] ||
        QUICK_ACTIONS.EMPLOYEE;

    /* ========================================================
       CLOSED LAUNCHER
       ======================================================== */

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
                    <Bot
                        size={25}
                    />

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

    /* ========================================================
       MINIMIZED
       ======================================================== */

    if (minimized) {
        return (
            <div
                className={`hr-chatbot-minimized ${themeClass}`}
            >
                <button
                    type="button"
                    onClick={() =>
                        setMinimized(
                            false
                        )
                    }
                    className="hr-chatbot-minimized-main"
                >
                    <Bot
                        size={20}
                    />

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
                    <X
                        size={17}
                    />
                </button>
            </div>
        );
    }

    /* ========================================================
       FULL CHAT UI
       ======================================================== */

    return (
        <div
            className={`hr-chatbot-container ${themeClass}`}
        >
            <div className="hr-chatbot-window">

                {/* HEADER */}

                <div className="hr-chatbot-header">
                    <div className="hr-chatbot-header-left">
                        <div className="hr-chatbot-header-avatar">
                            <Bot
                                size={22}
                            />

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
                                size={
                                    17
                                }
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
                                size={
                                    18
                                }
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
                            <X
                                size={
                                    19
                                }
                            />
                        </button>
                    </div>
                </div>

                {/* CONNECTION STATUS */}

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
                                    size={
                                        14
                                    }
                                />

                                <span>
                                    Quick
                                    actions
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
                            <X
                                size={
                                    14
                                }
                            />
                        </button>
                    </div>
                )}

                {/* INPUT */}

                <div className="hr-chatbot-input-area">
                    <div className="hr-chatbot-input-wrapper">
                        <textarea
                            ref={
                                inputRef
                            }
                            value={
                                input
                            }
                            onChange={(
                                event
                            ) =>
                                setInput(
                                    event
                                        .target
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
                            disabled={
                                loading
                            }
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
                                size={
                                    18
                                }
                            />
                        </button>
                    </div>

                    <div className="hr-chatbot-input-hint">
                        <span>
                            Press Enter
                            to send
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