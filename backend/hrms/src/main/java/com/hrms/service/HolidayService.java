
package com.hrms.service;

import com.hrms.entity.Holiday;
import com.hrms.repository.HolidayRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public HolidayService(HolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    // ============================================================
    // GET ALL HOLIDAYS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Holiday> getAllHolidays() {

        return holidayRepository
                .findAllByOrderByHolidayDateAsc();
    }

    // ============================================================
    // GET HOLIDAY BY ID
    // ============================================================

    @Transactional(readOnly = true)
    public Holiday getHolidayById(Long id) {

        return holidayRepository.findById(id)
                .orElseThrow(
                        () -> new IllegalStateException(
                                "Holiday not found"));
    }

    // ============================================================
    // CREATE HOLIDAY
    // ============================================================

    @Transactional
    public Holiday createHoliday(Holiday holiday) {

        // --------------------------------------------------------
        // HOLIDAY NAME
        // --------------------------------------------------------

        if (holiday.getHolidayName() == null
                || holiday.getHolidayName().isBlank()) {

            throw new IllegalArgumentException(
                    "Holiday name is required");
        }

        // --------------------------------------------------------
        // FROM DATE
        // --------------------------------------------------------

        if (holiday.getHolidayDate() == null) {

            throw new IllegalArgumentException(
                    "From date is required");
        }

        // --------------------------------------------------------
        // TO DATE
        // --------------------------------------------------------

        if (holiday.getHolidayToDate() == null) {

            throw new IllegalArgumentException(
                    "To date is required");
        }

        // --------------------------------------------------------
        // DATE VALIDATION
        // --------------------------------------------------------

        if (holiday.getHolidayToDate()
                .isBefore(holiday.getHolidayDate())) {

            throw new IllegalArgumentException(
                    "To date cannot be earlier than From date");
        }

        // --------------------------------------------------------
        // CHECK OVERLAPPING DATES
        // --------------------------------------------------------

        boolean conflict = holidayRepository.existsOverlappingHoliday(
                holiday.getHolidayDate(),
                holiday.getHolidayToDate());

        if (conflict) {

            throw new IllegalStateException(
                    "The requested holiday dates conflict with an existing holiday.");
        }

        // --------------------------------------------------------
        // NEW RECORD
        // --------------------------------------------------------

        holiday.setId(null);

        // --------------------------------------------------------
        // TRIM NAME
        // --------------------------------------------------------

        holiday.setHolidayName(
                holiday.getHolidayName().trim());

        // --------------------------------------------------------
        // DEFAULT HOLIDAY TYPE
        // --------------------------------------------------------

        if (holiday.getHolidayType() == null
                || holiday.getHolidayType().isBlank()) {

            holiday.setHolidayType("National");
        }

        // --------------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------------

        if (holiday.getDescription() != null) {

            holiday.setDescription(
                    holiday.getDescription().trim());
        }

        // --------------------------------------------------------
        // LOCATION
        // --------------------------------------------------------

        if (holiday.getLocation() != null) {

            holiday.setLocation(
                    holiday.getLocation().trim());
        }

        // --------------------------------------------------------
        // SAVE
        // --------------------------------------------------------

        return holidayRepository.save(holiday);
    }

    // ============================================================
    // UPDATE HOLIDAY
    // ============================================================

    @Transactional
    public Holiday updateHoliday(
            Long id,
            Holiday updated) {

        Holiday existing = getHolidayById(id);

        // --------------------------------------------------------
        // HOLIDAY NAME
        // --------------------------------------------------------

        if (updated.getHolidayName() == null
                || updated.getHolidayName().isBlank()) {

            throw new IllegalArgumentException(
                    "Holiday name is required");
        }

        // --------------------------------------------------------
        // FROM DATE
        // --------------------------------------------------------

        if (updated.getHolidayDate() == null) {

            throw new IllegalArgumentException(
                    "From date is required");
        }

        // --------------------------------------------------------
        // TO DATE
        // --------------------------------------------------------

        if (updated.getHolidayToDate() == null) {

            throw new IllegalArgumentException(
                    "To date is required");
        }

        // --------------------------------------------------------
        // DATE VALIDATION
        // --------------------------------------------------------

        if (updated.getHolidayToDate()
                .isBefore(updated.getHolidayDate())) {

            throw new IllegalArgumentException(
                    "To date cannot be earlier than From date");
        }

        // --------------------------------------------------------
        // CHECK OVERLAPPING DATES
        // EXCLUDE CURRENT HOLIDAY
        // --------------------------------------------------------

        boolean conflict = holidayRepository
                .existsOverlappingHolidayExceptId(
                        updated.getHolidayDate(),
                        updated.getHolidayToDate(),
                        id);

        if (conflict) {

            throw new IllegalStateException(
                    "The requested holiday dates conflict with an existing holiday.");
        }

        // --------------------------------------------------------
        // UPDATE FROM DATE
        // --------------------------------------------------------

        existing.setHolidayDate(
                updated.getHolidayDate());

        // --------------------------------------------------------
        // UPDATE TO DATE
        // --------------------------------------------------------

        existing.setHolidayToDate(
                updated.getHolidayToDate());

        // --------------------------------------------------------
        // UPDATE NAME
        // --------------------------------------------------------

        existing.setHolidayName(
                updated.getHolidayName().trim());

        // --------------------------------------------------------
        // DEFAULT HOLIDAY TYPE
        // --------------------------------------------------------

        if (updated.getHolidayType() == null
                || updated.getHolidayType().isBlank()) {

            existing.setHolidayType("National");

        } else {

            existing.setHolidayType(
                    updated.getHolidayType());
        }

        // --------------------------------------------------------
        // LOCATION
        // --------------------------------------------------------

        existing.setLocation(
                updated.getLocation() != null
                        ? updated.getLocation().trim()
                        : null);

        // --------------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------------

        existing.setDescription(
                updated.getDescription() != null
                        ? updated.getDescription().trim()
                        : null);

        // --------------------------------------------------------
        // SAVE
        // --------------------------------------------------------

        return holidayRepository.save(existing);
    }

    // ============================================================
    // DELETE HOLIDAY
    // ============================================================

    @Transactional
    public void deleteHoliday(Long id) {

        Holiday holiday = getHolidayById(id);

        holidayRepository.delete(holiday);
    }

    // ============================================================
    // CHECK HOLIDAY
    //
    // Returns true if the given date falls between
    // From Date and To Date.
    // ============================================================

    @Transactional(readOnly = true)
    public boolean isHoliday(LocalDate date) {

        if (date == null) {
            return false;
        }

        return holidayRepository
                .existsByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqual(
                        date,
                        date);
    }

    // ============================================================
    // FIND HOLIDAY BY DATE
    // ============================================================

    @Transactional(readOnly = true)
    public Holiday findByDate(LocalDate date) {

        if (date == null) {
            return null;
        }

        return holidayRepository
                .findByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqual(
                        date,
                        date)
                .orElse(null);
    }

    // ============================================================
    // GET HOLIDAYS BETWEEN DATES
    // ============================================================

    @Transactional(readOnly = true)
    public List<Holiday> getHolidaysBetween(
            LocalDate from,
            LocalDate to) {

        if (from == null || to == null) {
            throw new IllegalArgumentException(
                    "From date and To date are required");
        }

        if (to.isBefore(from)) {
            throw new IllegalArgumentException(
                    "To date cannot be earlier than From date");
        }

        return holidayRepository
                .findByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqualOrderByHolidayDateAsc(
                        to,
                        from);
    }
}
