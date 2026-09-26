package com.hrms.controller;

import com.hrms.entity.Holiday;
import com.hrms.service.HolidayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = "*")
public class HolidayController {

        private final HolidayService holidayService;

        public HolidayController(HolidayService holidayService) {
                this.holidayService = holidayService;
        }

        /**
         * GET all holidays
         */
        @GetMapping
        public ResponseEntity<List<Holiday>> getAllHolidays() {

                return ResponseEntity.ok(
                                holidayService.getAllHolidays());
        }

        /**
         * GET holiday by ID
         */
        @GetMapping("/{id}")
        public ResponseEntity<Holiday> getHolidayById(
                        @PathVariable Long id) {

                return ResponseEntity.ok(
                                holidayService.getHolidayById(id));
        }

        /**
         * CREATE holiday
         * HR can use this to manually add a holiday.
         */
        @PostMapping
        public ResponseEntity<Holiday> createHoliday(
                        @RequestBody Holiday holiday) {

                return ResponseEntity.ok(
                                holidayService.createHoliday(holiday));
        }

        /**
         * UPDATE holiday
         */
        @PutMapping("/{id}")
        public ResponseEntity<Holiday> updateHoliday(
                        @PathVariable Long id,
                        @RequestBody Holiday holiday) {

                return ResponseEntity.ok(
                                holidayService.updateHoliday(id, holiday));
        }

        /**
         * DELETE holiday
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteHoliday(
                        @PathVariable Long id) {

                holidayService.deleteHoliday(id);

                return ResponseEntity.noContent().build();
        }

        /**
         * GET holidays between dates.
         */
        @GetMapping("/between")
        public ResponseEntity<List<Holiday>> getHolidaysBetween(
                        @RequestParam LocalDate startDate,
                        @RequestParam LocalDate endDate) {

                return ResponseEntity.ok(
                                holidayService.getHolidaysBetween(
                                                startDate,
                                                endDate));
        }
}