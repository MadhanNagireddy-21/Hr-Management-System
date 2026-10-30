
package com.hrms.repository;

import com.hrms.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HolidayRepository
        extends JpaRepository<Holiday, Long> {

    // ============================================================
    // GET ALL HOLIDAYS
    // ============================================================

    List<Holiday> findAllByOrderByHolidayDateAsc();

    // ============================================================
    // FIND HOLIDAY BY EXACT FROM DATE
    // ============================================================

    Optional<Holiday> findByHolidayDate(
            LocalDate holidayDate);

    // ============================================================
    // CHECK IF DATE FALLS INSIDE HOLIDAY RANGE
    // ============================================================

    boolean existsByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqual(
            LocalDate date1,
            LocalDate date2);

    // ============================================================
    // FIND HOLIDAY FOR A PARTICULAR DATE
    // ============================================================

    Optional<Holiday> findByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqual(
            LocalDate fromDate,
            LocalDate toDate);

    // ============================================================
    // CHECK OVERLAPPING HOLIDAY RANGE
    //
    // Example:
    //
    // Existing: 20 Oct - 22 Oct
    // New: 21 Oct - 23 Oct
    //
    // Result: conflict
    // ============================================================

    @Query("""
                SELECT CASE
                    WHEN COUNT(h) > 0
                    THEN true
                    ELSE false
                END
                FROM Holiday h
                WHERE h.holidayDate <= :toDate
                AND h.holidayToDate >= :fromDate
            """)
    boolean existsOverlappingHoliday(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    // ============================================================
    // CHECK OVERLAPPING RANGE EXCLUDING CURRENT HOLIDAY
    // Used during UPDATE
    // ============================================================

    @Query("""
                SELECT CASE
                    WHEN COUNT(h) > 0
                    THEN true
                    ELSE false
                END
                FROM Holiday h
                WHERE h.id <> :id
                AND h.holidayDate <= :toDate
                AND h.holidayToDate >= :fromDate
            """)
    boolean existsOverlappingHolidayExceptId(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("id") Long id);

    // ============================================================
    // GET HOLIDAYS THAT OVERLAP A DATE RANGE
    // ============================================================

    List<Holiday> findByHolidayDateLessThanEqualAndHolidayToDateGreaterThanEqualOrderByHolidayDateAsc(
            LocalDate toDate,
            LocalDate fromDate);
}
