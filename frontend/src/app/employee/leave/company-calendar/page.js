'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    PartyPopper,
    Clock3,
    MapPin,
    Building2,
    Loader2,
    RefreshCw,
} from 'lucide-react';

import { useTheme } from 'next-themes';
import api from '@/lib/axios';


// ============================================================
// CONSTANTS
// ============================================================

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const WEEK_DAYS = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];


// ============================================================
// DATE HELPERS
// ============================================================

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}`;
};

const normalizeDate = (value) => {
    if (!value) return null;

    const raw = String(value).trim();

    // yyyy-MM-dd
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return formatDate(parsed);
};

const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};


// ============================================================
// HOLIDAY NORMALIZER
// ============================================================

const normalizeHoliday = (holiday, index) => {
    if (!holiday) return null;

    const dateValue =
        holiday.date ||
        holiday.holidayDate ||
        holiday.startDate ||
        holiday.day;

    const date = normalizeDate(dateValue);

    if (!date) return null;

    return {
        id:
            holiday.id ??
            holiday.holidayId ??
            `holiday-${index}-${date}`,

        date,

        name:
            holiday.name ||
            holiday.holidayName ||
            holiday.title ||
            'Company Holiday',

        description:
            holiday.description ||
            holiday.remarks ||
            holiday.reason ||
            '',

        type:
            holiday.type ||
            holiday.holidayType ||
            'PUBLIC',

        location:
            holiday.location ||
            holiday.officeLocation ||
            '',

        isOptional:
            Boolean(
                holiday.optional ??
                holiday.isOptional ??
                false
            ),
    };
};


// ============================================================
// COMPONENT
// ============================================================

export default function CompanyCalendarPage() {
    const { resolvedTheme } = useTheme();

    const isDark = resolvedTheme !== 'light';

    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        today.getMonth()
    );

    const [currentYear, setCurrentYear] = useState(
        today.getFullYear()
    );

    const [holidays, setHolidays] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [selectedHoliday, setSelectedHoliday] =
        useState(null);


    // ============================================================
    // LOAD HOLIDAYS
    // ============================================================

    const loadHolidays = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/api/holidays');

            const data = response?.data;

            let holidayArray = [];

            if (Array.isArray(data)) {
                holidayArray = data;
            } else if (Array.isArray(data?.content)) {
                holidayArray = data.content;
            } else if (Array.isArray(data?.data)) {
                holidayArray = data.data;
            } else if (Array.isArray(data?.holidays)) {
                holidayArray = data.holidays;
            }

            const normalized = holidayArray
                .map(normalizeHoliday)
                .filter(Boolean);

            setHolidays(normalized);

        } catch (err) {
            console.error(
                'Failed to load company holidays:',
                err
            );

            setError(
                err?.response?.data?.message ||
                'Unable to load company holidays.'
            );

            setHolidays([]);

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadHolidays();
    }, []);


    // ============================================================
    // HOLIDAYS FOR CURRENT MONTH
    // ============================================================

    const currentMonthHolidays = useMemo(() => {
        const monthPrefix =
            `${currentYear}-${pad(currentMonth + 1)}`;

        return holidays
            .filter((holiday) =>
                holiday.date.startsWith(monthPrefix)
            )
            .sort((a, b) =>
                a.date.localeCompare(b.date)
            );
    }, [
        holidays,
        currentMonth,
        currentYear,
    ]);


    // ============================================================
    // HOLIDAY LOOKUP
    // ============================================================

    const holidaysByDate = useMemo(() => {
        const map = {};

        holidays.forEach((holiday) => {
            if (!map[holiday.date]) {
                map[holiday.date] = [];
            }

            map[holiday.date].push(holiday);
        });

        return map;
    }, [holidays]);


    // ============================================================
    // NAVIGATION
    // ============================================================

    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((year) => year - 1);
        } else {
            setCurrentMonth((month) => month - 1);
        }
    };


    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((year) => year + 1);
        } else {
            setCurrentMonth((month) => month + 1);
        }
    };


    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };


    // ============================================================
    // CALENDAR CELLS
    // ============================================================

    const calendarCells = useMemo(() => {
        const firstDay =
            getFirstDayOfMonth(
                currentYear,
                currentMonth
            );

        const daysInMonth =
            getDaysInMonth(
                currentYear,
                currentMonth
            );

        const previousMonthDays =
            currentMonth === 0
                ? getDaysInMonth(
                    currentYear - 1,
                    11
                )
                : getDaysInMonth(
                    currentYear,
                    currentMonth - 1
                );

        const cells = [];

        // Previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = previousMonthDays - i;

            const date =
                currentMonth === 0
                    ? new Date(
                        currentYear - 1,
                        11,
                        day
                    )
                    : new Date(
                        currentYear,
                        currentMonth - 1,
                        day
                    );

            cells.push({
                date,
                currentMonth: false,
            });
        }

        // Current month
        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {
            cells.push({
                date: new Date(
                    currentYear,
                    currentMonth,
                    day
                ),
                currentMonth: true,
            });
        }

        // Next month
        let nextDay = 1;

        while (cells.length % 7 !== 0) {
            const date =
                currentMonth === 11
                    ? new Date(
                        currentYear + 1,
                        0,
                        nextDay
                    )
                    : new Date(
                        currentYear,
                        currentMonth + 1,
                        nextDay
                    );

            cells.push({
                date,
                currentMonth: false,
            });

            nextDay++;
        }

        return cells;
    }, [
        currentMonth,
        currentYear,
    ]);


    // ============================================================
    // COLORS
    // ============================================================

    const colors = {
        page: isDark
            ? '#080d18'
            : '#f8fafc',

        card: isDark
            ? '#111722'
            : '#ffffff',

        cardSecondary: isDark
            ? '#151b27'
            : '#f8fafc',

        border: isDark
            ? 'rgba(148,163,184,0.13)'
            : '#e2e8f0',

        text: isDark
            ? '#f8fafc'
            : '#0f172a',

        muted: isDark
            ? '#8fa0b8'
            : '#64748b',

        blue: '#3b82f6',

        blueSoft: isDark
            ? 'rgba(59,130,246,0.15)'
            : '#eff6ff',

        green: '#22c55e',

        greenSoft: isDark
            ? 'rgba(34,197,94,0.14)'
            : '#ecfdf5',

        holiday: '#f97316',

        holidaySoft: isDark
            ? 'rgba(249,115,22,0.14)'
            : '#fff7ed',

        purple: '#8b5cf6',
    };


    // ============================================================
    // TODAY CHECK
    // ============================================================

    const todayString = formatDate(today);


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div
            style={{
                minHeight: '100vh',
                background: colors.page,
                color: colors.text,
                padding: '28px',
                transition: 'all 0.2s ease',
            }}
        >

            {/* ======================================================
          HEADER
      ====================================================== */}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '20px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                }}
            >

                <div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '7px',
                        }}
                    >

                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: colors.blueSoft,
                                color: colors.blue,
                            }}
                        >
                            <Building2
                                size={23}
                                strokeWidth={2}
                            />
                        </div>

                        <h1
                            style={{
                                margin: 0,
                                fontSize: '27px',
                                fontWeight: 800,
                                letterSpacing: '-0.5px',
                            }}
                        >
                            Company Calendar
                        </h1>

                    </div>

                    <p
                        style={{
                            margin: 0,
                            color: colors.muted,
                            fontSize: '14px',
                        }}
                    >
                        View company holidays and important dates
                    </p>

                </div>


                {/* REFRESH */}

                <button
                    type="button"
                    onClick={loadHolidays}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: `1px solid ${colors.border}`,
                        background: colors.card,
                        color: colors.text,
                        padding: '10px 15px',
                        borderRadius: '10px',
                        cursor: loading
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        opacity: loading ? 0.65 : 1,
                    }}
                >
                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? 'company-calendar-spin'
                                : ''
                        }
                    />

                    Refresh
                </button>

            </div>


            {/* ======================================================
          MAIN CALENDAR CARD
      ====================================================== */}

            <div
                style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: isDark
                        ? '0 12px 35px rgba(0,0,0,0.18)'
                        : '0 12px 35px rgba(15,23,42,0.06)',
                }}
            >

                {/* ====================================================
            CALENDAR HEADER
        ==================================================== */}

                <div
                    style={{
                        padding: '20px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '15px',
                        borderBottom:
                            `1px solid ${colors.border}`,
                        flexWrap: 'wrap',
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >

                        <CalendarDays
                            size={22}
                            color={colors.blue}
                        />

                        <h2
                            style={{
                                margin: 0,
                                fontSize: '21px',
                                fontWeight: 800,
                            }}
                        >
                            {MONTHS[currentMonth]} {currentYear}
                        </h2>

                    </div>


                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >

                        <button
                            type="button"
                            onClick={goToPreviousMonth}
                            aria-label="Previous month"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                border:
                                    `1px solid ${colors.border}`,
                                background: colors.cardSecondary,
                                color: colors.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <ChevronLeft size={19} />
                        </button>


                        <button
                            type="button"
                            onClick={goToToday}
                            style={{
                                height: '40px',
                                padding: '0 15px',
                                borderRadius: '10px',
                                border:
                                    `1px solid ${colors.border}`,
                                background: colors.cardSecondary,
                                color: colors.text,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            Today
                        </button>


                        <button
                            type="button"
                            onClick={goToNextMonth}
                            aria-label="Next month"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                border:
                                    `1px solid ${colors.border}`,
                                background: colors.cardSecondary,
                                color: colors.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <ChevronRight size={19} />
                        </button>

                    </div>

                </div>


                {/* ====================================================
            LEGEND
        ==================================================== */}

                <div
                    style={{
                        padding: '12px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flexWrap: 'wrap',
                        borderBottom:
                            `1px solid ${colors.border}`,
                        color: colors.muted,
                        fontSize: '12px',
                        fontWeight: 600,
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                        }}
                    >
                        <span
                            style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '50%',
                                background: colors.holiday,
                            }}
                        />

                        Company Holiday
                    </div>


                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                        }}
                    >
                        <span
                            style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '50%',
                                background: colors.green,
                            }}
                        />

                        Today
                    </div>

                </div>


                {/* ====================================================
            WEEK DAYS
        ==================================================== */}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(7, minmax(0, 1fr))',
                        borderBottom:
                            `1px solid ${colors.border}`,
                    }}
                >

                    {WEEK_DAYS.map((day) => (
                        <div
                            key={day}
                            style={{
                                padding: '14px 10px',
                                textAlign: 'center',
                                color: colors.muted,
                                fontSize: '12px',
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                            }}
                        >
                            {day}
                        </div>
                    ))}

                </div>


                {/* ====================================================
            CALENDAR GRID
        ==================================================== */}

                {loading ? (

                    <div
                        style={{
                            minHeight: '500px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '12px',
                            color: colors.muted,
                        }}
                    >

                        <Loader2
                            size={30}
                            className="company-calendar-spin"
                            color={colors.blue}
                        />

                        <span>
                            Loading company calendar...
                        </span>

                    </div>

                ) : error ? (

                    <div
                        style={{
                            minHeight: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '15px',
                            padding: '30px',
                            textAlign: 'center',
                        }}
                    >

                        <CalendarDays
                            size={45}
                            color={colors.muted}
                        />

                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: '16px',
                            }}
                        >
                            Unable to load calendar
                        </div>

                        <div
                            style={{
                                color: colors.muted,
                                fontSize: '13px',
                            }}
                        >
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={loadHolidays}
                            style={{
                                border: 'none',
                                background: colors.blue,
                                color: '#ffffff',
                                padding: '10px 17px',
                                borderRadius: '9px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Try Again
                        </button>

                    </div>

                ) : (

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(7, minmax(0, 1fr))',
                        }}
                    >

                        {calendarCells.map(
                            (cell, index) => {

                                const dateString =
                                    formatDate(cell.date);

                                const dayHolidays =
                                    holidaysByDate[
                                    dateString
                                    ] || [];

                                const isToday =
                                    dateString ===
                                    todayString;

                                const isWeekend =
                                    cell.date.getDay() === 0 ||
                                    cell.date.getDay() === 6;

                                return (

                                    <div
                                        key={`${dateString}-${index}`}
                                        style={{
                                            minHeight: '118px',
                                            padding: '10px',
                                            borderRight:
                                                `1px solid ${colors.border}`,
                                            borderBottom:
                                                `1px solid ${colors.border}`,
                                            background:
                                                !cell.currentMonth
                                                    ? isDark
                                                        ? 'rgba(255,255,255,0.015)'
                                                        : '#fafafa'
                                                    : isToday
                                                        ? colors.greenSoft
                                                        : 'transparent',
                                            opacity:
                                                cell.currentMonth
                                                    ? 1
                                                    : 0.4,
                                            position: 'relative',
                                        }}
                                    >

                                        {/* DATE */}

                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent:
                                                    'space-between',
                                                marginBottom: '8px',
                                            }}
                                        >

                                            <div
                                                style={{
                                                    width: '29px',
                                                    height: '29px',
                                                    borderRadius:
                                                        isToday
                                                            ? '50%'
                                                            : '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'center',
                                                    background:
                                                        isToday
                                                            ? colors.green
                                                            : 'transparent',
                                                    color:
                                                        isToday
                                                            ? '#ffffff'
                                                            : isWeekend
                                                                ? colors.muted
                                                                : colors.text,
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {cell.date.getDate()}
                                            </div>


                                            {dayHolidays.length > 0 && (

                                                <div
                                                    style={{
                                                        width: '7px',
                                                        height: '7px',
                                                        borderRadius: '50%',
                                                        background:
                                                            colors.holiday,
                                                    }}
                                                />

                                            )}

                                        </div>


                                        {/* HOLIDAYS */}

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '5px',
                                            }}
                                        >

                                            {dayHolidays
                                                .slice(0, 2)
                                                .map((holiday) => (

                                                    <button
                                                        key={holiday.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedHoliday(
                                                                holiday
                                                            )
                                                        }
                                                        title={
                                                            holiday.name
                                                        }
                                                        style={{
                                                            width: '100%',
                                                            textAlign:
                                                                'left',
                                                            border: 'none',
                                                            borderRadius:
                                                                '7px',
                                                            padding:
                                                                '6px 7px',
                                                            background:
                                                                colors.holidaySoft,
                                                            color:
                                                                isDark
                                                                    ? '#fdba74'
                                                                    : '#c2410c',
                                                            cursor:
                                                                'pointer',
                                                            fontSize:
                                                                '11px',
                                                            fontWeight:
                                                                700,
                                                            overflow:
                                                                'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >

                                                        <span
                                                            style={{
                                                                display:
                                                                    'inline-block',
                                                                width: '5px',
                                                                height: '5px',
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    colors.holiday,
                                                                marginRight:
                                                                    '5px',
                                                                verticalAlign:
                                                                    'middle',
                                                            }}
                                                        />

                                                        {holiday.name}

                                                    </button>

                                                ))}


                                            {dayHolidays.length > 2 && (

                                                <span
                                                    style={{
                                                        fontSize: '10px',
                                                        color: colors.muted,
                                                        paddingLeft: '5px',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    +{dayHolidays.length - 2} more
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


            {/* ======================================================
          HOLIDAY LIST
      ====================================================== */}

            <div
                style={{
                    marginTop: '24px',
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '18px',
                    overflow: 'hidden',
                }}
            >

                <div
                    style={{
                        padding: '18px 22px',
                        borderBottom:
                            `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '15px',
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >

                        <PartyPopper
                            size={20}
                            color={colors.holiday}
                        />

                        <h3
                            style={{
                                margin: 0,
                                fontSize: '17px',
                                fontWeight: 800,
                            }}
                        >
                            {MONTHS[currentMonth]} Holidays
                        </h3>

                    </div>


                    <span
                        style={{
                            background: colors.blueSoft,
                            color: colors.blue,
                            borderRadius: '20px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                        }}
                    >
                        {currentMonthHolidays.length}{' '}
                        {currentMonthHolidays.length === 1
                            ? 'Holiday'
                            : 'Holidays'}
                    </span>

                </div>


                {currentMonthHolidays.length === 0 ? (

                    <div
                        style={{
                            padding: '35px 20px',
                            textAlign: 'center',
                            color: colors.muted,
                        }}
                    >

                        <CalendarDays
                            size={34}
                            style={{
                                marginBottom: '10px',
                                opacity: 0.6,
                            }}
                        />

                        <div
                            style={{
                                fontSize: '14px',
                                fontWeight: 700,
                            }}
                        >
                            No holidays added for this month
                        </div>

                        <div
                            style={{
                                fontSize: '12px',
                                marginTop: '5px',
                            }}
                        >
                            Company holidays added by HR/Admin
                            will appear here.
                        </div>

                    </div>

                ) : (

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >

                        {currentMonthHolidays.map(
                            (holiday) => {

                                const holidayDate =
                                    new Date(
                                        `${holiday.date}T00:00:00`
                                    );

                                const day =
                                    holidayDate.getDate();

                                const weekday =
                                    holidayDate.toLocaleDateString(
                                        'en-US',
                                        {
                                            weekday: 'short',
                                        }
                                    );

                                return (

                                    <button
                                        key={holiday.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedHoliday(
                                                holiday
                                            )
                                        }
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            textAlign: 'left',
                                            border:
                                                `1px solid ${colors.border}`,
                                            background:
                                                colors.cardSecondary,
                                            borderRadius: '13px',
                                            padding: '14px',
                                            cursor: 'pointer',
                                            color: colors.text,
                                        }}
                                    >

                                        <div
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                flexShrink: 0,
                                                borderRadius: '12px',
                                                background:
                                                    colors.holidaySoft,
                                                color:
                                                    colors.holiday,
                                                display: 'flex',
                                                flexDirection:
                                                    'column',
                                                alignItems: 'center',
                                                justifyContent:
                                                    'center',
                                            }}
                                        >

                                            <span
                                                style={{
                                                    fontSize: '17px',
                                                    fontWeight: 900,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {day}
                                            </span>

                                            <span
                                                style={{
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    marginTop: '3px',
                                                }}
                                            >
                                                {weekday}
                                            </span>

                                        </div>


                                        <div
                                            style={{
                                                minWidth: 0,
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 800,
                                                    overflow: 'hidden',
                                                    textOverflow:
                                                        'ellipsis',
                                                    whiteSpace:
                                                        'nowrap',
                                                }}
                                            >
                                                {holiday.name}
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    marginTop: '5px',
                                                    color: colors.muted,
                                                    fontSize: '11px',
                                                }}
                                            >

                                                <Clock3 size={12} />

                                                {holidayDate.toLocaleDateString(
                                                    'en-IN',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }
                                                )}

                                            </div>

                                        </div>

                                    </button>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* ======================================================
          HOLIDAY DETAILS MODAL
      ====================================================== */}

            {selectedHoliday && (

                <div
                    onClick={() =>
                        setSelectedHoliday(null)
                    }
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background:
                            'rgba(0,0,0,0.62)',
                        backdropFilter:
                            'blur(5px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >

                    <div
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        style={{
                            width: '100%',
                            maxWidth: '460px',
                            background: colors.card,
                            border:
                                `1px solid ${colors.border}`,
                            borderRadius: '18px',
                            padding: '24px',
                            boxShadow:
                                '0 25px 60px rgba(0,0,0,0.35)',
                        }}
                    >

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                            }}
                        >

                            <div
                                style={{
                                    width: '52px',
                                    height: '52px',
                                    flexShrink: 0,
                                    borderRadius: '14px',
                                    background:
                                        colors.holidaySoft,
                                    color:
                                        colors.holiday,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <PartyPopper size={25} />
                            </div>


                            <div
                                style={{
                                    flex: 1,
                                }}
                            >

                                <div
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 850,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {selectedHoliday.name}
                                </div>

                                <div
                                    style={{
                                        marginTop: '6px',
                                        color: colors.muted,
                                        fontSize: '13px',
                                    }}
                                >
                                    {new Date(
                                        `${selectedHoliday.date}T00:00:00`
                                    ).toLocaleDateString(
                                        'en-IN',
                                        {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        }
                                    )}
                                </div>

                            </div>

                        </div>


                        {selectedHoliday.description && (

                            <div
                                style={{
                                    marginTop: '22px',
                                    padding: '14px',
                                    borderRadius: '11px',
                                    background:
                                        colors.cardSecondary,
                                    color: colors.muted,
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                }}
                            >
                                {selectedHoliday.description}
                            </div>

                        )}


                        {selectedHoliday.location && (

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '15px',
                                    color: colors.muted,
                                    fontSize: '13px',
                                }}
                            >

                                <MapPin
                                    size={16}
                                    color={colors.blue}
                                />

                                {selectedHoliday.location}

                            </div>

                        )}


                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: '22px',
                            }}
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedHoliday(null)
                                }
                                style={{
                                    border: 'none',
                                    background: colors.blue,
                                    color: '#ffffff',
                                    padding: '10px 18px',
                                    borderRadius: '9px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ======================================================
          RESPONSIVE CSS
      ====================================================== */}

            <style jsx global>{`

        .company-calendar-spin {
          animation: companyCalendarSpin 1s linear infinite;
        }

        @keyframes companyCalendarSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {

          .company-calendar-page {
            padding: 18px !important;
          }

        }

        @media (max-width: 700px) {

          .company-calendar-grid {
            overflow-x: auto;
          }

          body {
            overflow-x: hidden;
          }

        }

        @media (max-width: 600px) {

          .company-calendar-mobile-cell {
            min-height: 90px !important;
          }

        }

      `}</style>

        </div>
    );
}