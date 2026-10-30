
'use client';

import React, { useEffect, useMemo, useState } from "react";

import {
    getAllHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
} from "../../../lib/holidayApi";

import {
    CalendarDays,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    MapPin,
    FileText,
    Tag,
    Calendar,
    Loader2,
    ChevronDown,
} from "lucide-react";

import "./HolidayManagement.css";

/* ============================================================
   EMPTY FORM
============================================================ */

const EMPTY_FORM = {
    holidayName: "",
    holidayDate: "",
    holidayToDate: "",
    description: "",
    createdBy: "",
};


/* ============================================================
   COMPONENT
============================================================ */

const HolidayManagement = () => {

    /* ============================================================
       STATE
    ============================================================ */

    const [holidays, setHolidays] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedYear, setSelectedYear] = useState("all");

    const [showModal, setShowModal] = useState(false);

    const [editingHoliday, setEditingHoliday] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [deleteId, setDeleteId] = useState(null);


    /* ============================================================
       GET LOGGED-IN USER
    ============================================================ */

    const getLoggedInUser = () => {
        try {
            const storedUser =
                localStorage.getItem("user") ||
                localStorage.getItem("employee") ||
                sessionStorage.getItem("user");

            if (storedUser) {
                const user = JSON.parse(storedUser);

                return (
                    user?.firstName ||
                    user?.name ||
                    user?.email ||
                    user?.employeeId ||
                    "HR"
                );
            }
        } catch (error) {
            console.error(
                "Unable to read logged-in user:",
                error
            );
        }

        return "HR";
    };


    /* ============================================================
       LOAD HOLIDAYS
    ============================================================ */

    const loadHolidays = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllHolidays();

            setHolidays(Array.isArray(data) ? data : []);

        } catch (error) {

            console.error(
                "Failed to load holidays:",
                error
            );

            if (error?.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    error?.response?.data?.message ||
                    "Failed to load holidays."
                );
            }

        } finally {
            setLoading(false);
        }
    };


    /* ============================================================
       INITIAL LOAD
    ============================================================ */

    useEffect(() => {
        loadHolidays();
    }, []);


    /* ============================================================
       FORM CHANGE
    ============================================================ */

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        /*
         * Clear old error while user is correcting the form.
         */
        if (error) {
            setError("");
        }
    };


    /* ============================================================
       OPEN ADD MODAL
    ============================================================ */

    const openAddModal = () => {

        setEditingHoliday(null);

        setForm({
            ...EMPTY_FORM,
            createdBy: getLoggedInUser(),
            location: "India",
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };


    /* ============================================================
       OPEN EDIT MODAL
    ============================================================ */

    const openEditModal = (holiday) => {

        setEditingHoliday(holiday);

        setForm({
            holidayName:
                holiday.holidayName ||
                holiday.name ||
                "",

            holidayDate:
                holiday.holidayDate ||
                "",

            holidayToDate:
                holiday.holidayToDate ||
                holiday.toDate ||
                holiday.endDate ||
                holiday.holidayDate ||
                "",

            description:
                holiday.description ||
                "",

            location:
                holiday.location ||
                "India",

            createdBy:
                holiday.createdBy ||
                getLoggedInUser(),
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };


    /* ============================================================
       CLOSE MODAL
    ============================================================ */

    const closeModal = () => {

        if (saving) return;

        setShowModal(false);

        setEditingHoliday(null);

        setForm(EMPTY_FORM);

        setError("");
        setSuccess("");
    };


    /* ============================================================
       SUBMIT FORM
    ============================================================ */

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        /* ----------------------------------------------------------
           VALIDATION
        ---------------------------------------------------------- */

        if (!form.holidayName.trim()) {

            setError(
                "Please enter the holiday name."
            );

            return;
        }


        if (!form.holidayDate) {

            setError(
                "Please select the From Date."
            );

            return;
        }


        if (!form.holidayToDate) {

            setError(
                "Please select the To Date."
            );

            return;
        }


        /*
         * Make sure To Date is not before From Date.
         */
        if (form.holidayToDate < form.holidayDate) {

            setError(
                "To Date cannot be earlier than From Date."
            );

            return;
        }


        if (!form.location.trim()) {

            setError(
                "Please enter the location."
            );

            return;
        }


        try {

            setSaving(true);


            /* ------------------------------------------------------
               PAYLOAD
            ------------------------------------------------------ */

            const payload = {

                holidayName:
                    form.holidayName.trim(),

                holidayDate:
                    form.holidayDate,

                holidayToDate:
                    form.holidayToDate,

                description:
                    form.description.trim(),

                location:
                    form.location.trim(),

                createdBy:
                    form.createdBy ||
                    getLoggedInUser(),
            };


            /* ------------------------------------------------------
               UPDATE
            ------------------------------------------------------ */

            if (editingHoliday) {

                await updateHoliday(
                    editingHoliday.id,
                    payload
                );

                setSuccess(
                    "Holiday updated successfully."
                );

            }

            /* ------------------------------------------------------
               CREATE
            ------------------------------------------------------ */

            else {

                await createHoliday(payload);

                setSuccess(
                    "Holiday added successfully."
                );
            }


            /* ------------------------------------------------------
               RELOAD DATA
            ------------------------------------------------------ */

            await loadHolidays();


            /* ------------------------------------------------------
               CLOSE MODAL
            ------------------------------------------------------ */

            setTimeout(() => {

                closeModal();

            }, 700);


        } catch (error) {

            console.error(
                "Holiday save error:",
                error
            );


            if (
                error?.response?.status === 401
            ) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    error?.response?.data?.message ||
                    error?.response?.data ||
                    "Unable to save holiday."
                );
            }

        } finally {

            setSaving(false);
        }
    };


    /* ============================================================
       DELETE HOLIDAY
    ============================================================ */

    const handleDelete = async (id) => {

        const holiday =
            holidays.find(
                (item) => item.id === id
            );


        const confirmed = window.confirm(
            `Are you sure you want to delete "${holiday?.holidayName || holiday?.name || "this holiday"}"?`
        );


        if (!confirmed) return;


        try {

            setDeleteId(id);

            setError("");


            await deleteHoliday(id);


            setHolidays((previous) =>
                previous.filter(
                    (item) => item.id !== id
                )
            );


            setSuccess(
                "Holiday deleted successfully."
            );


            setTimeout(() => {

                setSuccess("");

            }, 2500);


        } catch (error) {

            console.error(
                "Delete holiday error:",
                error
            );


            if (
                error?.response?.status === 401
            ) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else {

                setError(
                    error?.response?.data?.message ||
                    "Unable to delete holiday."
                );
            }

        } finally {

            setDeleteId(null);
        }
    };


    /* ============================================================
       GET HOLIDAY NAME
    ============================================================ */

    const getHolidayName = (holiday) => {

        return (
            holiday.holidayName ||
            holiday.name ||
            "Unnamed Holiday"
        );
    };


    /* ============================================================
       GET YEARS
    ============================================================ */

    const years = useMemo(() => {

        const uniqueYears = new Set();


        holidays.forEach((holiday) => {

            if (!holiday.holidayDate) return;


            const year =
                new Date(
                    `${holiday.holidayDate}T00:00:00`
                ).getFullYear();


            if (!Number.isNaN(year)) {

                uniqueYears.add(year);
            }
        });


        return Array.from(uniqueYears)
            .sort((a, b) => b - a);

    }, [holidays]);


    /* ============================================================
       FILTER HOLIDAYS
    ============================================================ */

    const filteredHolidays = useMemo(() => {

        return holidays.filter((holiday) => {

            const name =
                getHolidayName(holiday);


            const search =
                searchTerm
                    .toLowerCase()
                    .trim();


            const matchesSearch =
                !search ||
                name
                    .toLowerCase()
                    .includes(search) ||

                (holiday.description || "")
                    .toLowerCase()
                    .includes(search) ||

                (holiday.location || "")
                    .toLowerCase()
                    .includes(search);


            const holidayYear =
                holiday.holidayDate
                    ? new Date(
                        `${holiday.holidayDate}T00:00:00`
                    )
                        .getFullYear()
                        .toString()
                    : "";


            const matchesYear =
                selectedYear === "all" ||
                holidayYear === selectedYear;


            return (
                matchesSearch &&
                matchesYear
            );
        });

    }, [
        holidays,
        searchTerm,
        selectedYear,
    ]);


    /* ============================================================
       FORMAT DATE
    ============================================================ */

    const formatDate = (date) => {

        if (!date) return "-";


        const parsed =
            new Date(`${date}T00:00:00`);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return date;
        }


        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    /* ============================================================
       GET TO DATE
    ============================================================ */

    const getHolidayToDate = (holiday) => {

        return (
            holiday.holidayToDate ||
            holiday.toDate ||
            holiday.endDate ||
            holiday.holidayDate ||
            ""
        );
    };


    /* ============================================================
       CHECK SINGLE / RANGE DATE
    ============================================================ */

    const isDateRange = (holiday) => {

        const fromDate =
            holiday.holidayDate;

        const toDate =
            getHolidayToDate(holiday);


        return (
            fromDate &&
            toDate &&
            fromDate !== toDate
        );
    };


    /* ============================================================
       RENDER
    ============================================================ */

    return (

        <div className="holiday-page">


            {/* ======================================================
               HEADER
            ====================================================== */}

            <div className="holiday-header">

                <div className="holiday-header-left">

                    <div className="holiday-header-icon">

                        <CalendarDays size={28} />

                    </div>


                    <div>

                        <h1>
                            Holiday Management
                        </h1>

                        <p>
                            Manage company holidays and
                            maintain the official holiday calendar.
                        </p>

                    </div>

                </div>


                <button
                    type="button"
                    className="add-holiday-button"
                    onClick={openAddModal}
                >

                    <Plus size={19} />

                    Add Holiday

                </button>

            </div>


            {/* ======================================================
               ALERTS
            ====================================================== */}

            {error && (

                <div className="holiday-alert error">

                    <span>
                        {error}
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >

                        <X size={18} />

                    </button>

                </div>
            )}


            {success && (

                <div className="holiday-alert success">

                    <span>
                        {success}
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >

                        <X size={18} />

                    </button>

                </div>
            )}


            {/* ======================================================
               STATISTICS
            ====================================================== */}

            <div className="holiday-stats">


                {/* TOTAL */}

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">

                        <CalendarDays size={22} />

                    </div>


                    <div>

                        <span>
                            Total Holidays
                        </span>

                        <strong>
                            {holidays.length}
                        </strong>

                    </div>

                </div>


                {/* THIS YEAR */}

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">

                        <Calendar size={22} />

                    </div>


                    <div>

                        <span>
                            This Year
                        </span>


                        <strong>

                            {
                                holidays.filter(
                                    (holiday) => {

                                        if (
                                            !holiday.holidayDate
                                        ) {
                                            return false;
                                        }


                                        return (
                                            new Date(
                                                `${holiday.holidayDate}T00:00:00`
                                            ).getFullYear() ===
                                            new Date().getFullYear()
                                        );
                                    }
                                ).length
                            }

                        </strong>

                    </div>

                </div>


                {/* DATE RANGE */}

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">

                        <CalendarDays size={22} />

                    </div>


                    <div>

                        <span>
                            Date Range Holidays
                        </span>


                        <strong>

                            {
                                holidays.filter(
                                    (holiday) =>
                                        isDateRange(holiday)
                                ).length
                            }

                        </strong>

                    </div>

                </div>

            </div>


            {/* ======================================================
               FILTER BAR
            ====================================================== */}

            <div className="holiday-filter-card">


                {/* SEARCH */}

                <div className="holiday-search">

                    <Search size={19} />


                    <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                    />


                    {searchTerm && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearchTerm("")
                            }
                        >

                            <X size={17} />

                        </button>

                    )}

                </div>


                {/* YEAR */}

                <div className="holiday-select">

                    <select
                        value={selectedYear}
                        onChange={(event) =>
                            setSelectedYear(
                                event.target.value
                            )
                        }
                    >

                        <option value="all">
                            All Years
                        </option>


                        {years.map((year) => (

                            <option
                                key={year}
                                value={year.toString()}
                            >

                                {year}

                            </option>

                        ))}

                    </select>


                    <ChevronDown size={17} />

                </div>

            </div>


            {/* ======================================================
               HOLIDAY LIST
            ====================================================== */}

            <div className="holiday-list-card">


                <div className="holiday-list-header">

                    <div>

                        <h2>
                            Company Holidays
                        </h2>


                        <p>

                            {filteredHolidays.length}

                            {" "}

                            holiday
                            {
                                filteredHolidays.length !== 1
                                    ? "s"
                                    : ""
                            }

                            {" "}found

                        </p>

                    </div>

                </div>


                {/* LOADING */}

                {loading ? (

                    <div className="holiday-loading">

                        <Loader2
                            size={30}
                            className="holiday-spinner"
                        />

                        <p>
                            Loading holidays...
                        </p>

                    </div>


                ) : filteredHolidays.length === 0 ? (

                    /* EMPTY */

                    <div className="holiday-empty">

                        <div className="holiday-empty-icon">

                            <CalendarDays size={36} />

                        </div>


                        <h3>
                            No holidays found
                        </h3>


                        <p>
                            Add a holiday or change
                            your search filters.
                        </p>


                        <button
                            type="button"
                            onClick={openAddModal}
                        >

                            <Plus size={18} />

                            Add Holiday

                        </button>

                    </div>


                ) : (

                    /* TABLE */

                    <div className="holiday-table-wrapper">

                        <table className="holiday-table">

                            <thead>

                                <tr>

                                    <th>
                                        Holiday
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Created By
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredHolidays.map(
                                    (holiday) => (

                                        <tr
                                            key={
                                                holiday.id
                                            }
                                        >


                                            {/* HOLIDAY */}

                                            <td>

                                                <div className="holiday-name-cell">

                                                    <div className="holiday-row-icon">

                                                        <CalendarDays
                                                            size={18}
                                                        />

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {
                                                                getHolidayName(
                                                                    holiday
                                                                )
                                                            }
                                                        </strong>


                                                        <span>
                                                            Holiday #
                                                            {
                                                                holiday.id
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                <div className="date-cell">

                                                    <Calendar
                                                        size={16}
                                                    />


                                                    <div>

                                                        <span>
                                                            {
                                                                formatDate(
                                                                    holiday.holidayDate
                                                                )
                                                            }
                                                        </span>


                                                        {isDateRange(
                                                            holiday
                                                        ) && (

                                                                <small>
                                                                    to{" "}
                                                                    {
                                                                        formatDate(
                                                                            getHolidayToDate(
                                                                                holiday
                                                                            )
                                                                        )
                                                                    }
                                                                </small>

                                                            )}

                                                    </div>

                                                </div>

                                            </td>


                                            {/* LOCATION */}

                                            <td>

                                                <div className="location-cell">

                                                    <MapPin
                                                        size={16}
                                                    />


                                                    <span>
                                                        {
                                                            holiday.location ||
                                                            "India"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* DESCRIPTION */}

                                            <td>

                                                <div className="description-cell">

                                                    <FileText
                                                        size={15}
                                                    />


                                                    <span>
                                                        {
                                                            holiday.description ||
                                                            "—"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* CREATED BY */}

                                            <td>

                                                {
                                                    holiday.createdBy ||
                                                    "HR"
                                                }

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="holiday-actions">


                                                    {/* EDIT */}

                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        title="Edit Holiday"
                                                        onClick={() =>
                                                            openEditModal(
                                                                holiday
                                                            )
                                                        }
                                                    >

                                                        <Edit3
                                                            size={17}
                                                        />

                                                    </button>


                                                    {/* DELETE */}

                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        title="Delete Holiday"
                                                        disabled={
                                                            deleteId ===
                                                            holiday.id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                holiday.id
                                                            )
                                                        }
                                                    >

                                                        {deleteId ===
                                                            holiday.id ? (

                                                            <Loader2
                                                                size={17}
                                                                className="holiday-spinner"
                                                            />

                                                        ) : (

                                                            <Trash2
                                                                size={17}
                                                            />

                                                        )}

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* ======================================================
               ADD / EDIT MODAL
            ====================================================== */}

            {showModal && (

                <div
                    className="holiday-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            closeModal();
                        }

                    }}
                >


                    <div className="holiday-modal">


                        {/* MODAL HEADER */}

                        <div className="holiday-modal-header">

                            <div>

                                <div className="holiday-modal-title-icon">

                                    <CalendarDays
                                        size={21}
                                    />

                                </div>


                                <div>

                                    <h2>

                                        {
                                            editingHoliday
                                                ? "Edit Holiday"
                                                : "Add Holiday"
                                        }

                                    </h2>


                                    <p>

                                        {
                                            editingHoliday
                                                ? "Update holiday information."
                                                : "Add a new company holiday."
                                        }

                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                            >

                                <X size={21} />

                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            className="holiday-form"
                            onSubmit={handleSubmit}
                        >


                            {/* ==================================================
                               HOLIDAY NAME
                            ================================================== */}

                            <div className="form-group">

                                <label>

                                    Holiday Name

                                    <span>
                                        *
                                    </span>

                                </label>


                                <div className="input-with-icon">

                                    <Tag size={18} />


                                    <input
                                        type="text"
                                        name="holidayName"
                                        value={
                                            form.holidayName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Gandhi Jayanti"
                                        maxLength={150}
                                        required
                                    />

                                </div>

                            </div>


                            {/* ==================================================
                               DATE RANGE
                            ================================================== */}

                            <div className="form-row">


                                {/* FROM DATE */}

                                <div className="form-group">

                                    <label>

                                        From Date

                                        <span>
                                            *
                                        </span>

                                    </label>


                                    <div className="input-with-icon">

                                        <Calendar
                                            size={18}
                                        />


                                        <input
                                            type="date"
                                            name="holidayDate"
                                            value={
                                                form.holidayDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                {/* TO DATE */}

                                <div className="form-group">

                                    <label>

                                        To Date

                                        <span>
                                            *
                                        </span>

                                    </label>


                                    <div className="input-with-icon">

                                        <Calendar
                                            size={18}
                                        />


                                        <input
                                            type="date"
                                            name="holidayToDate"
                                            value={
                                                form.holidayToDate
                                            }
                                            min={
                                                form.holidayDate ||
                                                undefined
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* DATE RANGE HELP */}

                            <div
                                style={{
                                    marginTop: "-8px",
                                    marginBottom: "4px",
                                    fontSize: "13px",
                                    color: "#64748b",
                                }}
                            >

                                If the holiday is for a single
                                day, select the same date in both
                                fields.

                            </div>







                            {/* ==================================================
                               DESCRIPTION
                            ================================================== */}

                            <div className="form-group">

                                <label>
                                    Description
                                </label>


                                <div className="textarea-wrapper">

                                    <FileText
                                        size={18}
                                    />


                                    <textarea
                                        name="description"
                                        value={
                                            form.description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter holiday description..."
                                        maxLength={500}
                                        rows={4}
                                    />

                                </div>

                            </div>


                            {/* ==================================================
                               MODAL ERROR
                            ================================================== */}

                            {error && (

                                <div className="form-error">

                                    {error}

                                </div>

                            )}


                            {/* ==================================================
                               MODAL SUCCESS
                            ================================================== */}

                            {success && (

                                <div className="form-success">

                                    {success}

                                </div>

                            )}


                            {/* ==================================================
                               ACTIONS
                            ================================================== */}

                            <div className="holiday-modal-actions">


                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >

                                    Cancel

                                </button>


                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={saving}
                                >

                                    {saving ? (

                                        <>

                                            <Loader2
                                                size={18}
                                                className="holiday-spinner"
                                            />

                                            Saving...

                                        </>

                                    ) : (

                                        <>

                                            <CalendarDays
                                                size={18}
                                            />

                                            {
                                                editingHoliday
                                                    ? "Update Holiday"
                                                    : "Add Holiday"
                                            }

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default HolidayManagement;

