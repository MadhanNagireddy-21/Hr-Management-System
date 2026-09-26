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
                return holidayRepository.findAllByOrderByHolidayDateAsc();
        }

        // ============================================================
        // GET HOLIDAY BY ID
        // ============================================================

        @Transactional(readOnly = true)
        public Holiday getHolidayById(Long id) {
                return holidayRepository.findById(id)
                                .orElseThrow(() -> new IllegalStateException("Holiday not found"));
        }

        // ============================================================
        // CREATE HOLIDAY
        // ============================================================

        @Transactional
        public Holiday createHoliday(Holiday holiday) {

                if (holiday.getHolidayDate() == null) {
                        throw new IllegalArgumentException("Holiday date is required");
                }

                if (holiday.getHolidayName() == null
                                || holiday.getHolidayName().isBlank()) {
                        throw new IllegalArgumentException("Holiday name is required");
                }

                if (holidayRepository
                                .findByHolidayDate(holiday.getHolidayDate())
                                .isPresent()) {

                        throw new IllegalStateException(
                                        "A holiday already exists for " + holiday.getHolidayDate());
                }

                holiday.setId(null);
                holiday.setHolidayName(holiday.getHolidayName().trim());

                if (holiday.getDescription() != null) {
                        holiday.setDescription(holiday.getDescription().trim());
                }

                return holidayRepository.save(holiday);
        }

        // ============================================================
        // UPDATE HOLIDAY
        // ============================================================

        @Transactional
        public Holiday updateHoliday(Long id, Holiday updated) {

                Holiday existing = getHolidayById(id);

                if (updated.getHolidayDate() == null) {
                        throw new IllegalArgumentException("Holiday date is required");
                }

                if (updated.getHolidayName() == null
                                || updated.getHolidayName().isBlank()) {
                        throw new IllegalArgumentException("Holiday name is required");
                }

                boolean dateChanged = !updated.getHolidayDate().equals(existing.getHolidayDate());

                if (dateChanged
                                && holidayRepository
                                                .findByHolidayDate(updated.getHolidayDate())
                                                .isPresent()) {

                        throw new IllegalStateException(
                                        "A holiday already exists for " + updated.getHolidayDate());
                }

                existing.setHolidayDate(updated.getHolidayDate());
                existing.setHolidayName(updated.getHolidayName().trim());
                existing.setHolidayType(updated.getHolidayType());
                existing.setLocation(updated.getLocation());
                existing.setDescription(
                                updated.getDescription() != null
                                                ? updated.getDescription().trim()
                                                : null);

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
        // ============================================================

        @Transactional(readOnly = true)
        public boolean isHoliday(LocalDate date) {
                if (date == null) {
                        return false;
                }
                return holidayRepository.findByHolidayDate(date).isPresent();
        }

        // ============================================================
        // FIND HOLIDAY BY DATE
        // ============================================================

        @Transactional(readOnly = true)
        public Holiday findByDate(LocalDate date) {
                if (date == null) {
                        return null;
                }
                return holidayRepository.findByHolidayDate(date).orElse(null);
        }

        // ============================================================
        // GET HOLIDAYS BETWEEN DATES
        // ============================================================

        @Transactional(readOnly = true)
        public List<Holiday> getHolidaysBetween(LocalDate from, LocalDate to) {
                return holidayRepository
                                .findByHolidayDateBetweenOrderByHolidayDateAsc(from, to);
        }
}