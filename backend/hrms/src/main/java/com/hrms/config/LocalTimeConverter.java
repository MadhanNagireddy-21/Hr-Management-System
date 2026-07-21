package com.hrms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.sql.Time;
import java.time.LocalTime;

@Converter(autoApply = true)
public class LocalTimeConverter implements AttributeConverter<LocalTime, String> {

    @Override
    public String convertToDatabaseColumn(LocalTime localTime) {
        return localTime == null ? null : localTime.format(java.time.format.DateTimeFormatter.ISO_LOCAL_TIME);
    }

    @Override
    public LocalTime convertToEntityAttribute(String timeString) {
        if (timeString == null) return null;
        if (timeString.length() > 8) {
            timeString = timeString.substring(0, 8);
        }
        return LocalTime.parse(timeString);
    }
}
