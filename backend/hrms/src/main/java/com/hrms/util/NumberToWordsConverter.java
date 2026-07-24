package com.hrms.util;

import java.math.BigDecimal;

public class NumberToWordsConverter {
    private static final String[] units = {
            "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
            "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
            "SEVENTEEN", "EIGHTEEN", "NINETEEN"
    };
    private static final String[] tens = {
            "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"
    };

    public static String convert(BigDecimal amount) {
        long value = amount.longValue(); // rupees only, ignoring paise for payslip words
        if (value == 0)
            return "RUPEES ZERO ONLY";
        return "RUPEES " + convertToWords(value).trim() + " ONLY";
    }

    private static String convertToWords(long num) {
        if (num == 0)
            return "";
        if (num < 20)
            return units[(int) num] + " ";
        if (num < 100)
            return tens[(int) (num / 10)] + " " + convertToWords(num % 10);
        if (num < 1000)
            return units[(int) (num / 100)] + " HUNDRED " + convertToWords(num % 100);
        if (num < 100000)
            return convertToWords(num / 1000) + "THOUSAND " + convertToWords(num % 1000);
        if (num < 10000000)
            return convertToWords(num / 100000) + "LAKH " + convertToWords(num % 100000);
        return convertToWords(num / 10000000) + "CRORE " + convertToWords(num % 10000000);
    }
}