package com.hrms.repository;

import com.hrms.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

        /**
         * Find holiday by exact date.
         */
        Optional<Holiday> findByHolidayDate(LocalDate holidayDate);

        /**
         * Get all holidays ordered by date.
         */
        List<Holiday> findAllByOrderByHolidayDateAsc();

        /**
         * Get holidays between two dates.
         */
        List<Holiday> findByHolidayDateBetweenOrderByHolidayDateAsc(
                        LocalDate startDate,
                        LocalDate endDate);
}