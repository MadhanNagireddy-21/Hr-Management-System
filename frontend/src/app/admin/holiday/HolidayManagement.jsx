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

const EMPTY_FORM = {
    holidayName: "",
    holidayDate: "",
    holidayType: "National",
    description: "",
    location: "India",
    createdBy: "",
};

const HolidayManagement = () => {
    // ============================================================
    // STATE
    // ============================================================

    const [holidays, setHolidays] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedYear, setSelectedYear] = useState("all");

    const [selectedType, setSelectedType] = useState("all");

    const [showModal, setShowModal] = useState(false);

    const [editingHoliday, setEditingHoliday] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [deleteId, setDeleteId] = useState(null);

    // ============================================================
    // GET LOGGED-IN USER
    // ============================================================

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
            console.error("Unable to read logged-in user:", error);
        }

        return "HR";
    };

    // ============================================================
    // LOAD HOLIDAYS
    // ============================================================

    const loadHolidays = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllHolidays();

            setHolidays(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load holidays:", error);

            if (error?.response?.status === 401) {
                setError("Your session has expired. Please login again.");
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

    useEffect(() => {
        loadHolidays();
    }, []);

    // ============================================================
    // FORM CHANGE
    // ============================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ============================================================
    // OPEN ADD MODAL
    // ============================================================

    const openAddModal = () => {
        setEditingHoliday(null);

        setForm({
            ...EMPTY_FORM,
            createdBy: getLoggedInUser(),
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ============================================================
    // OPEN EDIT MODAL
    // ============================================================

    const openEditModal = (holiday) => {
        setEditingHoliday(holiday);

        setForm({
            holidayName: holiday.holidayName || holiday.name || "",
            holidayDate: holiday.holidayDate || "",
            holidayType: holiday.holidayType || "National",
            description: holiday.description || "",
            location: holiday.location || "India",
            createdBy: holiday.createdBy || getLoggedInUser(),
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ============================================================
    // CLOSE MODAL
    // ============================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingHoliday(null);
        setForm(EMPTY_FORM);
        setError("");
    };

    // ============================================================
    // SUBMIT FORM
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // ----------------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------------

        if (!form.holidayName.trim()) {
            setError("Please enter the holiday name.");
            return;
        }

        if (!form.holidayDate) {
            setError("Please select the holiday date.");
            return;
        }

        if (!form.holidayType) {
            setError("Please select the holiday type.");
            return;
        }

        if (!form.location.trim()) {
            setError("Please enter the location.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                holidayName: form.holidayName.trim(),
                holidayDate: form.holidayDate,
                holidayType: form.holidayType,
                description: form.description.trim(),
                location: form.location.trim(),
                createdBy: form.createdBy || getLoggedInUser(),
            };

            // --------------------------------------------------------
            // UPDATE
            // --------------------------------------------------------

            if (editingHoliday) {
                await updateHoliday(editingHoliday.id, payload);

                setSuccess("Holiday updated successfully.");
            }

            // --------------------------------------------------------
            // CREATE
            // --------------------------------------------------------

            else {
                await createHoliday(payload);

                setSuccess("Holiday added successfully.");
            }

            await loadHolidays();

            setTimeout(() => {
                closeModal();
            }, 700);
        } catch (error) {
            console.error("Holiday save error:", error);

            if (error?.response?.status === 401) {
                setError("Your session has expired. Please login again.");
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

    // ============================================================
    // DELETE HOLIDAY
    // ============================================================

    const handleDelete = async (id) => {
        const holiday = holidays.find((item) => item.id === id);

        const confirmed = window.confirm(
            `Are you sure you want to delete "${holiday?.holidayName || holiday?.name || "this holiday"}"?`
        );

        if (!confirmed) return;

        try {
            setDeleteId(id);
            setError("");

            await deleteHoliday(id);

            setHolidays((previous) =>
                previous.filter((item) => item.id !== id)
            );

            setSuccess("Holiday deleted successfully.");

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (error) {
            console.error("Delete holiday error:", error);

            if (error?.response?.status === 401) {
                setError("Your session has expired. Please login again.");
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

    // ============================================================
    // GET HOLIDAY NAME
    // ============================================================

    const getHolidayName = (holiday) => {
        return holiday.holidayName || holiday.name || "Unnamed Holiday";
    };

    // ============================================================
    // GET YEARS
    // ============================================================

    const years = useMemo(() => {
        const uniqueYears = new Set();

        holidays.forEach((holiday) => {
            if (!holiday.holidayDate) return;

            const year = new Date(holiday.holidayDate).getFullYear();

            if (!Number.isNaN(year)) {
                uniqueYears.add(year);
            }
        });

        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [holidays]);

    // ============================================================
    // FILTER HOLIDAYS
    // ============================================================

    const filteredHolidays = useMemo(() => {
        return holidays.filter((holiday) => {
            const name = getHolidayName(holiday);

            const search = searchTerm.toLowerCase().trim();

            const matchesSearch =
                !search ||
                name.toLowerCase().includes(search) ||
                (holiday.description || "")
                    .toLowerCase()
                    .includes(search) ||
                (holiday.location || "")
                    .toLowerCase()
                    .includes(search);

            const holidayYear = holiday.holidayDate
                ? new Date(holiday.holidayDate).getFullYear().toString()
                : "";

            const matchesYear =
                selectedYear === "all" ||
                holidayYear === selectedYear;

            const matchesType =
                selectedType === "all" ||
                holiday.holidayType === selectedType;

            return matchesSearch && matchesYear && matchesType;
        });
    }, [
        holidays,
        searchTerm,
        selectedYear,
        selectedType,
    ]);

    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // ============================================================
    // TYPE CLASS
    // ============================================================

    const getTypeClass = (type) => {
        switch ((type || "").toLowerCase()) {
            case "national":
                return "holiday-type national";

            case "festival":
                return "holiday-type festival";

            case "company":
                return "holiday-type company";

            case "optional":
                return "holiday-type optional";

            default:
                return "holiday-type";
        }
    };

    // ============================================================
    // RENDER
    // ============================================================

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
                        <h1>Holiday Management</h1>

                        <p>
                            Manage company holidays and maintain the
                            official holiday calendar.
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
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {success && (
                <div className="holiday-alert success">
                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ======================================================
          STATISTICS
      ====================================================== */}

            <div className="holiday-stats">

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">
                        <CalendarDays size={22} />
                    </div>

                    <div>
                        <span>Total Holidays</span>
                        <strong>{holidays.length}</strong>
                    </div>

                </div>

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">
                        <Calendar size={22} />
                    </div>

                    <div>
                        <span>This Year</span>

                        <strong>
                            {
                                holidays.filter((holiday) => {
                                    if (!holiday.holidayDate) return false;

                                    return (
                                        new Date(
                                            `${holiday.holidayDate}T00:00:00`
                                        ).getFullYear() ===
                                        new Date().getFullYear()
                                    );
                                }).length
                            }
                        </strong>
                    </div>

                </div>

                <div className="holiday-stat-card">

                    <div className="holiday-stat-icon">
                        <Tag size={22} />
                    </div>

                    <div>
                        <span>National Holidays</span>

                        <strong>
                            {
                                holidays.filter(
                                    (holiday) =>
                                        holiday.holidayType === "National"
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

                <div className="holiday-search">

                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                        >
                            <X size={17} />
                        </button>
                    )}

                </div>

                <div className="holiday-select">

                    <select
                        value={selectedYear}
                        onChange={(event) =>
                            setSelectedYear(event.target.value)
                        }
                    >
                        <option value="all">All Years</option>

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

                <div className="holiday-select">

                    <select
                        value={selectedType}
                        onChange={(event) =>
                            setSelectedType(event.target.value)
                        }
                    >
                        <option value="all">All Types</option>
                        <option value="National">National</option>
                        <option value="Festival">Festival</option>
                        <option value="Company">Company</option>
                        <option value="Optional">Optional</option>
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
                        <h2>Company Holidays</h2>

                        <p>
                            {filteredHolidays.length} holiday
                            {filteredHolidays.length !== 1 ? "s" : ""}
                            {" "}found
                        </p>
                    </div>

                </div>

                {loading ? (
                    <div className="holiday-loading">

                        <Loader2
                            size={30}
                            className="holiday-spinner"
                        />

                        <p>Loading holidays...</p>

                    </div>
                ) : filteredHolidays.length === 0 ? (

                    <div className="holiday-empty">

                        <div className="holiday-empty-icon">
                            <CalendarDays size={36} />
                        </div>

                        <h3>No holidays found</h3>

                        <p>
                            Add a holiday or change your search filters.
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

                    <div className="holiday-table-wrapper">

                        <table className="holiday-table">

                            <thead>
                                <tr>
                                    <th>Holiday</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredHolidays.map((holiday) => (

                                    <tr key={holiday.id}>

                                        <td>

                                            <div className="holiday-name-cell">

                                                <div className="holiday-row-icon">
                                                    <CalendarDays size={18} />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {getHolidayName(holiday)}
                                                    </strong>

                                                    <span>
                                                        Holiday #{holiday.id}
                                                    </span>
                                                </div>

                                            </div>

                                        </td>

                                        <td>

                                            <div className="date-cell">
                                                <Calendar size={16} />
                                                {formatDate(
                                                    holiday.holidayDate
                                                )}
                                            </div>

                                        </td>

                                        <td>

                                            <span
                                                className={getTypeClass(
                                                    holiday.holidayType
                                                )}
                                            >
                                                {holiday.holidayType || "General"}
                                            </span>

                                        </td>

                                        <td>

                                            <div className="location-cell">

                                                <MapPin size={16} />

                                                <span>
                                                    {holiday.location || "India"}
                                                </span>

                                            </div>

                                        </td>

                                        <td>

                                            <div className="description-cell">

                                                <FileText size={15} />

                                                <span>
                                                    {holiday.description || "—"}
                                                </span>

                                            </div>

                                        </td>

                                        <td>
                                            {holiday.createdBy || "HR"}
                                        </td>

                                        <td>

                                            <div className="holiday-actions">

                                                <button
                                                    type="button"
                                                    className="edit-button"
                                                    title="Edit Holiday"
                                                    onClick={() =>
                                                        openEditModal(holiday)
                                                    }
                                                >
                                                    <Edit3 size={17} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete-button"
                                                    title="Delete Holiday"
                                                    disabled={
                                                        deleteId === holiday.id
                                                    }
                                                    onClick={() =>
                                                        handleDelete(holiday.id)
                                                    }
                                                >
                                                    {deleteId === holiday.id ? (
                                                        <Loader2
                                                            size={17}
                                                            className="holiday-spinner"
                                                        />
                                                    ) : (
                                                        <Trash2 size={17} />
                                                    )}
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

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
                            event.target === event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="holiday-modal">

                        <div className="holiday-modal-header">

                            <div>

                                <div className="holiday-modal-title-icon">
                                    <CalendarDays size={21} />
                                </div>

                                <div>
                                    <h2>
                                        {editingHoliday
                                            ? "Edit Holiday"
                                            : "Add Holiday"}
                                    </h2>

                                    <p>
                                        {editingHoliday
                                            ? "Update holiday information."
                                            : "Add a new company holiday."}
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
                                    <span>*</span>
                                </label>

                                <div className="input-with-icon">

                                    <Tag size={18} />

                                    <input
                                        type="text"
                                        name="holidayName"
                                        value={form.holidayName}
                                        onChange={handleChange}
                                        placeholder="e.g. Gandhi Jayanti"
                                        maxLength={150}
                                        required
                                    />

                                </div>

                            </div>

                            {/* ==================================================
                  DATE
              ================================================== */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Holiday Date
                                        <span>*</span>
                                    </label>

                                    <div className="input-with-icon">

                                        <Calendar size={18} />

                                        <input
                                            type="date"
                                            name="holidayDate"
                                            value={form.holidayDate}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                </div>

                                {/* ==================================================
                    TYPE
                ================================================== */}

                                <div className="form-group">

                                    <label>
                                        Holiday Type
                                        <span>*</span>
                                    </label>

                                    <div className="select-wrapper">

                                        <select
                                            name="holidayType"
                                            value={form.holidayType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="National">
                                                National
                                            </option>

                                            <option value="Festival">
                                                Festival
                                            </option>

                                            <option value="Company">
                                                Company
                                            </option>

                                            <option value="Optional">
                                                Optional
                                            </option>
                                        </select>

                                        <ChevronDown size={17} />

                                    </div>

                                </div>

                            </div>

                            {/* ==================================================
                  LOCATION
              ================================================== */}

                            <div className="form-group">

                                <label>Location</label>

                                <div className="input-with-icon">

                                    <MapPin size={18} />

                                    <input
                                        type="text"
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        placeholder="e.g. India"
                                        maxLength={100}
                                    />

                                </div>

                            </div>

                            {/* ==================================================
                  DESCRIPTION
              ================================================== */}

                            <div className="form-group">

                                <label>Description</label>

                                <div className="textarea-wrapper">

                                    <FileText size={18} />

                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Enter holiday description..."
                                        maxLength={500}
                                        rows={4}
                                    />

                                </div>

                            </div>

                            {/* ==================================================
                  CREATED BY
              ================================================== */}

                            <div className="form-group">

                                <label>Created By</label>

                                <input
                                    type="text"
                                    name="createdBy"
                                    value={form.createdBy}
                                    onChange={handleChange}
                                    placeholder="HR"
                                    maxLength={100}
                                />

                            </div>

                            {/* ==================================================
                  MODAL ERROR
              ================================================== */}

                            {error && (

                                <div className="form-error">
                                    {error}
                                </div>

                            )}

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
                                            <CalendarDays size={18} />
                                            {editingHoliday
                                                ? "Update Holiday"
                                                : "Add Holiday"}
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