package com.hrms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Converter(autoApply = true)
public class LocalDateStringConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate date) {
        return date == null ? null : date.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    @Override
    public LocalDate convertToEntityAttribute(String dateString) {
        if (dateString == null) return null;
        // Handle cases where the database might return "YYYY-MM-DD HH:MM:SS"
        if (dateString.length() > 10) {
            dateString = dateString.substring(0, 10);
        }
        return LocalDate.parse(dateString);
    }
}
