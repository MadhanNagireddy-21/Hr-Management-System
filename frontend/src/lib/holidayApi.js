import axios from "axios";

// ============================================================
// BASE URL
// ============================================================

const API_BASE_URL =
    "https://hrms.saitejainfotechprivatelimited.com";

// ============================================================
// AXIOS INSTANCE
// ============================================================

const holidayApi = axios.create({
    baseURL: `${API_BASE_URL}/api/holidays`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================================
// ADD JWT TOKEN AUTOMATICALLY
// ============================================================

holidayApi.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("token") ||
            sessionStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// GET ALL HOLIDAYS
// ============================================================

export const getAllHolidays = async () => {
    const response = await holidayApi.get("");
    return response.data;
};

// ============================================================
// GET HOLIDAY BY ID
// ============================================================

export const getHolidayById = async (id) => {
    const response = await holidayApi.get(`/${id}`);
    return response.data;
};

// ============================================================
// CREATE HOLIDAY
// ============================================================

export const createHoliday = async (holidayData) => {
    const response = await holidayApi.post("", holidayData);
    return response.data;
};

// ============================================================
// UPDATE HOLIDAY
// ============================================================

export const updateHoliday = async (id, holidayData) => {
    const response = await holidayApi.put(`/${id}`, holidayData);
    return response.data;
};

// ============================================================
// DELETE HOLIDAY
// ============================================================

export const deleteHoliday = async (id) => {
    const response = await holidayApi.delete(`/${id}`);
    return response.data;
};

// ============================================================
// GET HOLIDAYS BETWEEN DATES
// ============================================================

export const getHolidaysBetween = async (startDate, endDate) => {
    const response = await holidayApi.get("/between", {
        params: {
            startDate,
            endDate,
        },
    });

    return response.data;
};

export default holidayApi;