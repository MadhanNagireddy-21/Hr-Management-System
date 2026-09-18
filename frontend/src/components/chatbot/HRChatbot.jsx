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
    MapPin,
    Award,
    CheckCircle2,
    ExternalLink,
    CircleDot,
} from 'lucide-react';

import './HRChatbot.css';
import { HttpStatusCode } from 'axios';

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http:https://hrms.saitejainfotechprivatelimited.com/';

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

    return String(name)
        .trim()
        .split(/\s+/)[0];
}

// ============================================================
// GREETING
// ============================================================

function getGreeting(role, name) {
    const firstName = getFirstName(name);

    if (role === 'ADMIN') {
        return `Hello ${firstName} 👋`;
    }

    if (role === 'HR') {
        return `Hello ${firstName} 👋`;
    }

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
    /*
     * Expected backend response:
     *
     * {
     *   success: true,
     *   message: "...",
     *   data: {
     *      reply: "...",
     *      intent: "...",
     *      type: "...",
     *      leaveBalances: [],
     *      trainings: []
     *   }
     * }
     */

    const data = response?.data?.data;

    if (typeof data?.reply === 'string') {
        const backendType = String(data?.type || '').toUpperCase();

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

    // Fallback if backend returns a slightly different structure
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

    return {
        text: 'I received a response from the HRMS server, but I could not read the response correctly.',
        type: 'info',
        data: null,
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
        return 'The HR Assistant service could not be found. Please check that the backend is running.';
    }

    if (status >= 500) {
        return 'The HRMS server encountered an error while processing your request. Please try again.';
    }

    if (error?.code === 'ERR_NETWORK') {
        return 'I could not connect to the HRMS server. Please make sure the backend is running.';
    }

    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Something went wrong while contacting the HR Assistant. Please try again.'
    );
}

// ============================================================
// FORMAT LEAVE BALANCE DATA
// ============================================================

function formatLeaveBalances(data) {
    if (!data?.leaveBalances?.length) {
        return null;
    }

    return data.leaveBalances;
}

// ============================================================
// FORMAT TRAINING DATA
// ============================================================

function formatTrainings(data) {
    if (!Array.isArray(data?.trainings)) {
        return null;
    }

    return data.trainings;
}

// ============================================================
// RECRUITMENT DATA
// ============================================================

function formatRecruitmentJobs(data) {
    return Array.isArray(data?.jobs) ? data.jobs : null;
}

function formatRecruitmentApplications(data) {
    return Array.isArray(data?.recruitmentApplications)
        ? data.recruitmentApplications
        : null;
}

function formatEmploymentType(value) {
    if (!value) return 'Not specified';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPostingStatus(value) {
    if (!value) return 'Open';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatApplicationStatus(value) {
    if (!value) return 'Applied';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatExperience(years, months) {
    const y = years !== null && years !== undefined && years !== ''
        ? Number(years) : null;
    const m = months !== null && months !== undefined && months !== ''
        ? Number(months) : null;

    if (y === null && m === null) return 'Not specified';

    const parts = [];
    if (y !== null && !Number.isNaN(y) && y > 0) {
        parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    }
    if (m !== null && !Number.isNaN(m) && m > 0) {
        parts.push(`${m} ${m === 1 ? 'month' : 'months'}`);
    }
    return parts.length ? parts.join(' ') : 'Fresher';
}

function formatDateTime(value) {
    if (!value) return 'Not specified';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}

function getJobTitle(job) {
    return job?.title || job?.jobTitle || 'Job Opening';
}

function getJobStatus(job) {
    return String(job?.status || job?.postingStatus || 'OPEN').toUpperCase();
}

// ============================================================
// TRAINING STATUS
// ============================================================

function getTrainingStatus(training) {
    const explicitStatus = String(
        training?.status ||
        training?.trainingStatus ||
        training?.enrollmentStatus ||
        ''
    ).toUpperCase();

    if (
        explicitStatus === 'CANCELLED' ||
        explicitStatus === 'CANCELED'
    ) {
        return 'CANCELLED';
    }

    if (
        explicitStatus === 'COMPLETED' ||
        training?.completed === true ||
        training?.completionStatus === 'COMPLETED'
    ) {
        return 'COMPLETED';
    }

    if (
        explicitStatus === 'ONGOING' ||
        explicitStatus === 'IN_PROGRESS' ||
        explicitStatus === 'INPROGRESS'
    ) {
        return 'ONGOING';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = parseDateOnly(training?.startDate);
    const end = parseDateOnly(training?.endDate);

    if (start && today < start) {
        return 'UPCOMING';
    }

    if (start && end && today >= start && today <= end) {
        return 'ONGOING';
    }

    if (end && today > end) {
        return 'COMPLETED';
    }

    return explicitStatus || 'UPCOMING';
}

// ============================================================
// DATE PARSER
// ============================================================

function parseDateOnly(value) {
    if (!value) return null;

    const text = String(value);

    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);

        const date = new Date(year, month, day);

        if (!Number.isNaN(date.getTime())) {
            date.setHours(0, 0, 0, 0);
            return date;
        }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setHours(0, 0, 0, 0);

    return date;
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
    if (!value) return 'Not specified';

    const date = parseDateOnly(value);

    if (!date) {
        return String(value);
    }

    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    } catch {
        return String(value);
    }
}

// ============================================================
// FORMAT TRAINING MODE
// ============================================================

function formatTrainingMode(mode) {
    if (!mode) return 'Not specified';

    return String(mode)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ============================================================
// FORMAT TRAINING CATEGORY
// ============================================================

function formatTrainingCategory(category) {
    if (!category) return 'Training';

    return String(category)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ============================================================
// FORMAT TRAINING STATUS LABEL
// ============================================================

function formatTrainingStatus(status) {
    if (!status) return 'Upcoming';

    switch (String(status).toUpperCase()) {
        case 'ONGOING':
            return 'Ongoing';

        case 'COMPLETED':
            return 'Completed';

        case 'CANCELLED':
        case 'CANCELED':
            return 'Cancelled';

        case 'ENROLLED':
            return 'Enrolled';

        case 'UPCOMING':
            return 'Upcoming';

        case 'IN_PROGRESS':
        case 'INPROGRESS':
            return 'In Progress';

        default:
            return String(status)
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}

// ============================================================
// FORMAT SCORE
// ============================================================

function formatScore(training) {
    const score =
        training?.score ??
        training?.trainingScore ??
        training?.assessmentScore ??
        training?.marks;

    if (
        score === null ||
        score === undefined ||
        score === ''
    ) {
        return null;
    }

    return String(score);
}

// ============================================================
// GET TRAINING TITLE
// ============================================================

function getTrainingTitle(training) {
    return (
        training?.title ||
        training?.trainingTitle ||
        training?.name ||
        'Training Program'
    );
}

// ============================================================
// GET TRAINER
// ============================================================

function getTrainer(training) {
    return (
        training?.trainer ||
        training?.trainerName ||
        training?.instructor ||
        training?.instructorName ||
        'Not specified'
    );
}

// ============================================================
// GET ENROLLMENT STATUS
// ============================================================

function getEnrollmentStatus(training) {
    return (
        training?.enrollmentStatus ||
        training?.enrollment?.status ||
        training?.status ||
        null
    );
}

// ============================================================
// GET TRAINING LINK
// ============================================================

function getTrainingLink(training) {
    return (
        training?.meetingLink ||
        training?.trainingLink ||
        training?.link ||
        training?.url ||
        null
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HRChatbot() {
    const { user } = useSelector((state) => state.auth);
    const { resolvedTheme } = useTheme();

    const role = getRole(user);
    const isDark = resolvedTheme === 'dark';

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

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
        QUICK_ACTIONS[role] || QUICK_ACTIONS.EMPLOYEE;

    // ==========================================================
    // AUTO SCROLL
    // ==========================================================

    useEffect(() => {
        if (!isOpen || isMinimized) return;

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
        if (isOpen && !isMinimized) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 150);
        }
    }, [
        isOpen,
        isMinimized,
    ]);

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
        setMessages((prev) => [
            ...prev,
            {
                id: `${sender}-${Date.now()}-${Math.random()}`,
                sender,
                text,
                time: new Date(),
                type,
                data,
            },
        ]);
    };

    // ==========================================================
    // SEND MESSAGE
    // ==========================================================

    const sendMessage = async (customMessage = null) => {
        const text = String(
            customMessage !== null
                ? customMessage
                : message
        ).trim();

        if (!text || isTyping) return;

        // Add user message
        addMessage(
            'user',
            text,
            'normal',
            null
        );

        setMessage('');
        setIsTyping(true);

        try {
            // --------------------------------------------------
            // ACCESS TOKEN
            // --------------------------------------------------

            const accessToken =
                typeof window !== 'undefined'
                    ? sessionStorage.getItem(
                        'accessToken'
                    )
                    : null;

            if (!accessToken) {
                const error = new Error(
                    'No active HRMS session was found.'
                );

                error.response = {
                    status: 401,
                    data: {
                        message:
                            'No active HRMS session was found.',
                    },
                };

                throw error;
            }

            // --------------------------------------------------
            // CALL BACKEND
            // --------------------------------------------------

            const response = await fetch(
                `https://api.saitejainfotechprivatelimited.com/api/chatbot/message`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: userMessage
                    }),
                }
            );
            

    // --------------------------------------------------
    // PARSE RESPONSE
    // --------------------------------------------------

    let responseData = null;

    try {
        responseData =
            await response.json();
    } catch {
        responseData = null;
    }

    // --------------------------------------------------
    // HTTP ERROR
    // --------------------------------------------------

    if (!response.ok) {
        const error = new Error(
            responseData?.message ||
            responseData?.error ||
            `Request failed with status ${response.status}`
        );

        error.response = {
            status: response.status,
            data: responseData,
        };

        throw error;
    }

    // --------------------------------------------------
    // FORMAT BACKEND RESPONSE
    // --------------------------------------------------

    const backendResponse =
        getBackendReply({
            data: responseData,
        });

    // --------------------------------------------------
    // LEAVE DATA
    // --------------------------------------------------

    const leaveBalances =
        formatLeaveBalances(
            backendResponse.data
        );

    // --------------------------------------------------
    // TRAINING DATA
    // --------------------------------------------------

    const trainings =
        formatTrainings(
            backendResponse.data
        );

    const recruitmentJobs =
        formatRecruitmentJobs(
            backendResponse.data
        );

    const recruitmentApplications =
        formatRecruitmentApplications(
            backendResponse.data
        );

    const recruitmentSummary =
        backendResponse.data?.recruitmentSummary || null;

    // --------------------------------------------------
    // DATA TO SEND TO MESSAGE
    // --------------------------------------------------

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

    if (
        backendResponse.type ===
        'training' &&
        trainings
    ) {
        messageData =
            trainings;
    }

    if (
        backendResponse.type ===
        'recruitment' &&
        (
            recruitmentJobs ||
            recruitmentApplications ||
            recruitmentSummary
        )
    ) {
        messageData = {
            jobs: recruitmentJobs || [],
            recruitmentApplications:
                recruitmentApplications || [],
            recruitmentSummary,
        };
    }

    // --------------------------------------------------
    // ADD BOT RESPONSE
    // --------------------------------------------------

    addMessage(
        'bot',
        backendResponse.text,
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
                                        (prev) =>
                                            !prev
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
                                <X size={18} />
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
                                                                user?.name
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
                                                        } ${item.type ===
                                                            'training'
                                                            ? 'training-message'
                                                            : ''
                                                        } ${item.type ===
                                                            'recruitment'
                                                            ? 'recruitment-message'
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
                                                    item.data
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
                                                                        key={`${balance.leaveType}-${index}`}
                                                                    >

                                                                        <div className="hr-chatbot-leave-card-top">

                                                                            <span>
                                                                                {formatLeaveName(
                                                                                    balance.leaveType
                                                                                )}
                                                                            </span>

                                                                            <CalendarDays
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />

                                                                        </div>

                                                                        <div className="hr-chatbot-leave-card-number">

                                                                            {balance.remaining ===
                                                                                'Unlimited'
                                                                                ? '∞'
                                                                                : formatNumber(
                                                                                    balance.remaining
                                                                                )}

                                                                        </div>

                                                                        <div className="hr-chatbot-leave-card-label">

                                                                            {balance.remaining ===
                                                                                'Unlimited'
                                                                                ? 'Unlimited'
                                                                                : 'days remaining'}

                                                                        </div>

                                                                        {balance.remaining !==
                                                                            'Unlimited' && (
                                                                                <div className="hr-chatbot-leave-card-meta">
                                                                                    Used{' '}
                                                                                    {formatNumber(
                                                                                        balance.used
                                                                                    )}{' '}
                                                                                    of{' '}
                                                                                    {formatNumber(
                                                                                        balance.total
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                    </div>
                                                                )
                                                            )}

                                                        </div>
                                                    )}

                                                {/* =================================================
                                                        TRAINING CARDS
                                                    ================================================== */}

                                                {item.type ===
                                                    'training' &&
                                                    Array.isArray(
                                                        item.data
                                                    ) &&
                                                    item.data
                                                        .length >
                                                    0 && (
                                                        <div className="hr-chatbot-training-cards">

                                                            {item.data.map(
                                                                (
                                                                    training,
                                                                    index
                                                                ) => (
                                                                    <TrainingCard
                                                                        key={
                                                                            training?.id ||
                                                                            training?.trainingId ||
                                                                            `${getTrainingTitle(
                                                                                training
                                                                            )}-${index}`
                                                                        }
                                                                        training={
                                                                            training
                                                                        }
                                                                    />
                                                                )
                                                            )}

                                                        </div>
                                                    )}

                                                {/* =================================================
                                                        NO TRAINING DATA
                                                    ================================================== */}

                                                {item.type ===
                                                    'training' &&
                                                    Array.isArray(
                                                        item.data
                                                    ) &&
                                                    item.data
                                                        .length ===
                                                    0 && (
                                                        <div className="hr-chatbot-training-empty">
                                                            <GraduationCap
                                                                size={
                                                                    22
                                                                }
                                                            />

                                                            <div>
                                                                <strong>
                                                                    No training records
                                                                </strong>

                                                                <span>
                                                                    No training information is currently available for you.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}


                                                {/* =================================================
                                                         RECRUITMENT SUMMARY
                                                     ================================================== */}

                                                {item.type ===
                                                    'recruitment' &&
                                                    item.data?.recruitmentSummary && (
                                                        <RecruitmentSummaryCard
                                                            summary={item.data.recruitmentSummary}
                                                        />
                                                    )}

                                                {/* =================================================
                                                         RECRUITMENT JOB CARDS
                                                     ================================================== */}

                                                {item.type ===
                                                    'recruitment' &&
                                                    Array.isArray(item.data?.jobs) &&
                                                    item.data.jobs.length > 0 && (
                                                        <div className="hr-chatbot-recruitment-cards">
                                                            {item.data.jobs.map((job, index) => (
                                                                <RecruitmentJobCard
                                                                    key={job?.id || `${getJobTitle(job)}-${index}`}
                                                                    job={job}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                {/* =================================================
                                                         RECRUITMENT REFERRAL CARDS
                                                     ================================================== */}

                                                {item.type ===
                                                    'recruitment' &&
                                                    Array.isArray(item.data?.recruitmentApplications) &&
                                                    item.data.recruitmentApplications.length > 0 && (
                                                        <div className="hr-chatbot-referral-cards">
                                                            {item.data.recruitmentApplications.map((referral, index) => (
                                                                <RecruitmentReferralCard
                                                                    key={referral?.id || `${referral?.candidateName || 'referral'}-${index}`}
                                                                    referral={referral}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                {item.type ===
                                                    'recruitment' &&
                                                    Array.isArray(item.data?.jobs) &&
                                                    Array.isArray(item.data?.recruitmentApplications) &&
                                                    item.data.jobs.length === 0 &&
                                                    item.data.recruitmentApplications.length === 0 && (
                                                        <div className="hr-chatbot-recruitment-empty">
                                                            <BriefcaseBusiness size={22} />
                                                            <div>
                                                                <strong>No recruitment records</strong>
                                                                <span>
                                                                    No matching job openings or referral information is currently available.
                                                                </span>
                                                            </div>
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

                                                        {user?.name
                                                            ?.split(
                                                                ' '
                                                            )
                                                            .map(
                                                                (
                                                                    n
                                                                ) =>
                                                                    n[0]
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

// ============================================================
// TRAINING CARD
// ============================================================

function TrainingCard({ training }) {
    const status =
        getTrainingStatus(training);

    const title =
        getTrainingTitle(training);

    const trainer =
        getTrainer(training);

    const score =
        formatScore(training);

    const meetingLink =
        getTrainingLink(training);

    const enrollmentStatus =
        getEnrollmentStatus(training);

    const category =
        formatTrainingCategory(
            training?.category
        );

    const mode =
        formatTrainingMode(
            training?.mode
        );

    const duration =
        training?.durationHours ??
        training?.duration ??
        null;

    const venue =
        training?.venue ||
        training?.location ||
        null;

    const description =
        training?.description ||
        training?.details ||
        null;

    const completed =
        training?.completed === true ||
        String(
            training?.completionStatus ||
            ''
        ).toUpperCase() === 'COMPLETED' ||
        status === 'COMPLETED';

    return (
        <div className="hr-chatbot-training-card">

            {/* =================================================
                CARD HEADER
            ================================================== */}

            <div className="hr-chatbot-training-card-header">

                <div className="hr-chatbot-training-icon">
                    <GraduationCap
                        size={19}
                    />
                </div>

                <div className="hr-chatbot-training-title-wrap">

                    <div className="hr-chatbot-training-title">
                        {title}
                    </div>

                    <div className="hr-chatbot-training-category">
                        {category}
                    </div>

                </div>

                <span
                    className={`hr-chatbot-training-status status-${String(
                        status
                    )
                        .toLowerCase()
                        .replace(/_/g, '-')}`}
                >
                    <CircleDot
                        size={10}
                    />

                    {formatTrainingStatus(
                        status
                    )}
                </span>

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================== */}

            {description && (
                <div className="hr-chatbot-training-description">
                    {description}
                </div>
            )}

            {/* =================================================
                TRAINING DETAILS
            ================================================== */}

            <div className="hr-chatbot-training-details">

                <div className="hr-chatbot-training-detail">

                    <span className="hr-chatbot-training-detail-icon">
                        <User
                            size={13}
                        />
                    </span>

                    <div>
                        <small>
                            Trainer
                        </small>

                        <strong>
                            {trainer}
                        </strong>
                    </div>

                </div>

                <div className="hr-chatbot-training-detail">

                    <span className="hr-chatbot-training-detail-icon">
                        <BookOpen
                            size={13}
                        />
                    </span>

                    <div>
                        <small>
                            Mode
                        </small>

                        <strong>
                            {mode}
                        </strong>
                    </div>

                </div>

                {duration !==
                    null &&
                    duration !==
                    undefined && (
                        <div className="hr-chatbot-training-detail">

                            <span className="hr-chatbot-training-detail-icon">
                                <Clock
                                    size={13}
                                />
                            </span>

                            <div>
                                <small>
                                    Duration
                                </small>

                                <strong>
                                    {duration}{' '}
                                    {Number(
                                        duration
                                    ) ===
                                        1
                                        ? 'hour'
                                        : 'hours'}
                                </strong>
                            </div>

                        </div>
                    )}

                {venue && (
                    <div className="hr-chatbot-training-detail">

                        <span className="hr-chatbot-training-detail-icon">
                            <MapPin
                                size={13}
                            />
                        </span>

                        <div>
                            <small>
                                Venue
                            </small>

                            <strong>
                                {venue}
                            </strong>
                        </div>

                    </div>
                )}

            </div>

            {/* =================================================
                DATE SECTION
            ================================================== */}

            <div className="hr-chatbot-training-dates">

                <div className="hr-chatbot-training-date">

                    <Calendar
                        size={14}
                    />

                    <div>
                        <small>
                            Starts
                        </small>

                        <strong>
                            {formatDate(
                                training?.startDate
                            )}
                        </strong>
                    </div>

                </div>

                <div className="hr-chatbot-training-date-divider" />

                <div className="hr-chatbot-training-date">

                    <Calendar
                        size={14}
                    />

                    <div>
                        <small>
                            Ends
                        </small>

                        <strong>
                            {formatDate(
                                training?.endDate
                            )}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                ENROLLMENT / SCORE
            ================================================== */}

            {(enrollmentStatus ||
                score !== null ||
                completed) && (
                    <div className="hr-chatbot-training-footer">

                        {enrollmentStatus && (
                            <div className="hr-chatbot-training-enrollment">

                                <CheckCircle2
                                    size={14}
                                />

                                <span>
                                    {String(
                                        enrollmentStatus
                                    )
                                        .replace(
                                            /_/g,
                                            ' '
                                        )
                                        .replace(
                                            /\b\w/g,
                                            (
                                                char
                                            ) =>
                                                char.toUpperCase()
                                        )}
                                </span>

                            </div>
                        )}

                        {completed && (
                            <div className="hr-chatbot-training-completed">

                                <CheckCircle2
                                    size={14}
                                />

                                Completed

                            </div>
                        )}

                        {score !== null && (
                            <div className="hr-chatbot-training-score">

                                <Award
                                    size={14}
                                />

                                <span>
                                    Score
                                </span>

                                <strong>
                                    {score}
                                </strong>

                            </div>
                        )}

                    </div>
                )}

            {/* =================================================
                COMPLETION DATE
            ================================================== */}

            {training?.completedDate && (
                <div className="hr-chatbot-training-completed-date">

                    <CheckCircle2
                        size={13}
                    />

                    Completed on{' '}
                    <strong>
                        {formatDate(
                            training.completedDate
                        )}
                    </strong>

                </div>
            )}

            {/* =================================================
                FEEDBACK
            ================================================== */}

            {training?.feedback && (
                <div className="hr-chatbot-training-feedback">

                    <strong>
                        Feedback
                    </strong>

                    <span>
                        {training.feedback}
                    </span>

                </div>
            )}

            {/* =================================================
                MEETING / TRAINING LINK
            ================================================== */}

            {meetingLink && (
                <a
                    href={
                        meetingLink
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hr-chatbot-training-link"
                >
                    <ExternalLink
                        size={14}
                    />

                    Open Training

                </a>
            )}

        </div>
    );
}

// ============================================================
// RECRUITMENT SUMMARY HELPERS
// ============================================================

function formatRecruitmentSummaryDate(value) {
    if (!value) return 'Today';

    try {
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return String(value);

        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    } catch {
        return String(value);
    }
}

// ============================================================
// RECRUITMENT SUMMARY CARD
// ============================================================

function RecruitmentSummaryCard({ summary }) {
    if (!summary) return null;

    const primaryMetrics = [
        { label: 'Total Jobs', value: summary.totalJobs, icon: BriefcaseBusiness, tone: 'blue' },
        { label: 'Open Positions', value: summary.openPositions, icon: CircleDot, tone: 'green' },
        { label: 'Applications', value: summary.totalApplications, icon: Users, tone: 'purple' },
        { label: 'Shortlisted', value: summary.shortlistedCount, icon: CheckCircle2, tone: 'orange' },
    ];

    const statusMetrics = [
        ['Draft', summary.draftJobs],
        ['On Hold', summary.onHoldJobs],
        ['Closed', summary.closedJobs],
    ];

    const pipelineMetrics = [
        ['Applied', summary.appliedCount],
        ['Shortlisted', summary.shortlistedCount],
        ['Interviews', summary.interviewScheduledCount],
        ['Interviewed', summary.interviewedCount],
        ['Offers Sent', summary.offerSentCount],
        ['Offers Accepted', summary.offerAcceptedCount],
        ['Offers Rejected', summary.offerRejectedCount],
        ['Rejected', summary.rejectedCount],
        ['Withdrawn', summary.withdrawnCount],
    ];

    return (
        <div className="hr-chatbot-recruitment-summary">
            <div className="hr-chatbot-recruitment-summary-header">
                <div className="hr-chatbot-recruitment-summary-heading">
                    <div className="hr-chatbot-recruitment-summary-icon">
                        <BriefcaseBusiness size={18} />
                    </div>
                    <div>
                        <strong>Recruitment Overview</strong>
                        <span>Current hiring activity and application pipeline</span>
                    </div>
                </div>
                <div className="hr-chatbot-recruitment-summary-date">
                    <Calendar size={13} />
                    {formatRecruitmentSummaryDate(summary.asOfDate)}
                </div>
            </div>

            <div className="hr-chatbot-recruitment-summary-primary">
                {primaryMetrics.map(({ label, value, icon: Icon, tone }) => (
                    <div className={`hr-chatbot-recruitment-summary-stat tone-${tone}`} key={label}>
                        <div className="hr-chatbot-recruitment-summary-stat-icon"><Icon size={15} /></div>
                        <div>
                            <strong>{formatNumber(value)}</strong>
                            <span>{label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hr-chatbot-recruitment-summary-section">
                <div className="hr-chatbot-recruitment-summary-section-title">
                    <span>Job Status</span>
                    <span className="hr-chatbot-recruitment-summary-total">{formatNumber(summary.totalJobs)} total</span>
                </div>
                <div className="hr-chatbot-recruitment-summary-status-row">
                    {statusMetrics.map(([label, value]) => (
                        <div className="hr-chatbot-recruitment-summary-status-item" key={label}>
                            <span>{label}</span>
                            <strong>{formatNumber(value)}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hr-chatbot-recruitment-summary-section">
                <div className="hr-chatbot-recruitment-summary-section-title">
                    <span>Application Pipeline</span>
                    <span className="hr-chatbot-recruitment-summary-total">{formatNumber(summary.totalApplications)} total</span>
                </div>
                <div className="hr-chatbot-recruitment-summary-pipeline">
                    {pipelineMetrics.map(([label, value]) => (
                        <div className="hr-chatbot-recruitment-summary-pipeline-item" key={label}>
                            <span>{label}</span>
                            <strong>{formatNumber(value)}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hr-chatbot-recruitment-summary-activity">
                <div className="hr-chatbot-recruitment-summary-activity-card">
                    <div className="hr-chatbot-recruitment-summary-activity-icon"><CalendarDays size={15} /></div>
                    <div>
                        <span>Upcoming interviews</span>
                        <strong>{formatNumber(summary.upcomingInterviewsCount)}</strong>
                        <small>Next 7 days</small>
                    </div>
                </div>
                <div className="hr-chatbot-recruitment-summary-activity-card">
                    <div className="hr-chatbot-recruitment-summary-activity-icon"><Clock3 size={15} /></div>
                    <div>
                        <span>Jobs closing soon</span>
                        <strong>{formatNumber(summary.jobsClosingSoonCount)}</strong>
                        <small>Next 7 days</small>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// RECRUITMENT JOB CARD
// ============================================================

function RecruitmentJobCard({ job }) {
    const status = getJobStatus(job);
    const title = getJobTitle(job);

    return (
        <div className="hr-chatbot-recruitment-card">
            <div className="hr-chatbot-recruitment-card-header">
                <div className="hr-chatbot-recruitment-icon">
                    <BriefcaseBusiness size={19} />
                </div>

                <div className="hr-chatbot-recruitment-title-wrap">
                    <div className="hr-chatbot-recruitment-title">
                        {title}
                    </div>
                    <div className="hr-chatbot-recruitment-department">
                        {job?.department || 'Not specified'}
                    </div>
                </div>

                <span
                    className={`hr-chatbot-recruitment-status status-${status
                        .toLowerCase()
                        .replace(/_/g, '-')}`}
                >
                    <CircleDot size={10} />
                    {formatPostingStatus(status)}
                </span>
            </div>

            <div className="hr-chatbot-recruitment-meta-grid">
                <div className="hr-chatbot-recruitment-meta">
                    <MapPin size={13} />
                    <div>
                        <small>Location</small>
                        <strong>{job?.location || 'Not specified'}</strong>
                    </div>
                </div>

                <div className="hr-chatbot-recruitment-meta">
                    <BriefcaseBusiness size={13} />
                    <div>
                        <small>Employment</small>
                        <strong>
                            {formatEmploymentType(job?.employmentType)}
                        </strong>
                    </div>
                </div>

                <div className="hr-chatbot-recruitment-meta">
                    <User size={13} />
                    <div>
                        <small>Experience</small>
                        <strong>
                            {job?.experienceRequired || 'Not specified'}
                        </strong>
                    </div>
                </div>

                <div className="hr-chatbot-recruitment-meta">
                    <WalletCards size={13} />
                    <div>
                        <small>Salary</small>
                        <strong>
                            {job?.salaryRange || 'Not specified'}
                        </strong>
                    </div>
                </div>
            </div>

            {job?.applicationDeadline && (
                <div className="hr-chatbot-recruitment-deadline">
                    <Calendar size={14} />
                    <span>Application deadline</span>
                    <strong>{formatDate(job.applicationDeadline)}</strong>
                </div>
            )}

            {job?.description && (
                <div className="hr-chatbot-recruitment-section">
                    <small>Description</small>
                    <p>{job.description}</p>
                </div>
            )}

            {job?.requirements && (
                <div className="hr-chatbot-recruitment-section">
                    <small>Requirements</small>
                    <p>{job.requirements}</p>
                </div>
            )}

            {job?.applicationCount !== null &&
                job?.applicationCount !== undefined && (
                    <div className="hr-chatbot-recruitment-footer">
                        <span>Applications received</span>
                        <strong>
                            {formatNumber(job.applicationCount)}
                        </strong>
                    </div>
                )}
        </div>
    );
}

// ============================================================
// RECRUITMENT REFERRAL CARD
// ============================================================

function RecruitmentReferralCard({ referral }) {
    return (
        <div className="hr-chatbot-referral-card">
            <div className="hr-chatbot-referral-header">
                <div className="hr-chatbot-referral-avatar">
                    <UserRound size={17} />
                </div>

                <div className="hr-chatbot-referral-title-wrap">
                    <div className="hr-chatbot-referral-name">
                        {referral?.candidateName || 'Candidate'}
                    </div>
                    <div className="hr-chatbot-referral-position">
                        {referral?.jobTitle || 'Job opening'}
                    </div>
                </div>

                <span className="hr-chatbot-referral-status">
                    <CircleDot size={9} />
                    {formatApplicationStatus(referral?.status)}
                </span>
            </div>

            <div className="hr-chatbot-referral-details">
                <div className="hr-chatbot-referral-detail">
                    <User size={13} />
                    <div>
                        <small>Experience</small>
                        <strong>
                            {formatExperience(
                                referral?.experienceYears,
                                referral?.experienceMonths
                            )}
                        </strong>
                    </div>
                </div>

                {referral?.currentCompany && (
                    <div className="hr-chatbot-referral-detail">
                        <BriefcaseBusiness size={13} />
                        <div>
                            <small>Current company</small>
                            <strong>{referral.currentCompany}</strong>
                        </div>
                    </div>
                )}

                {referral?.interviewDate && (
                    <div className="hr-chatbot-referral-detail">
                        <Calendar size={13} />
                        <div>
                            <small>Interview</small>
                            <strong>
                                {formatDate(referral.interviewDate)}
                            </strong>
                        </div>
                    </div>
                )}

                <div className="hr-chatbot-referral-detail">
                    <Clock size={13} />
                    <div>
                        <small>Applied</small>
                        <strong>
                            {formatDateTime(referral?.appliedAt)}
                        </strong>
                    </div>
                </div>
            </div>

            {referral?.interviewMode && (
                <div className="hr-chatbot-referral-footer">
                    Interview mode:
                    <strong>
                        {formatEmploymentType(referral.interviewMode)}
                    </strong>
                </div>
            )}
        </div>
    );
}

// ============================================================
// LEAVE NAME FORMATTER
// ============================================================

function formatLeaveName(
    leaveType
) {
    if (!leaveType) {
        return 'Leave';
    }

    switch (
    String(
        leaveType
    ).toUpperCase()
    ) {
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
            return leaveType;
    }
}

// ============================================================
// NUMBER FORMATTER
// ============================================================

function formatNumber(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return '0';
    }

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {
        return String(
            value
        );
    }

    if (
        Number.isInteger(
            number
        )
    ) {
        return String(
            number
        );
    }

    return number.toFixed(
        2
    );
}