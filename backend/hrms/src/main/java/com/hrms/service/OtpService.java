package com.hrms.service;

import com.hrms.entity.OtpStore;
import com.hrms.repository.OtpStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpStoreRepository otpStoreRepository;

    @Transactional
    public String generateAndSaveOtp(String email) {
        otpStoreRepository.deleteByEmail(email);

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpStore otpStore = new OtpStore(
                email,
                otp,
                LocalDateTime.now().plusMinutes(10)
        );
        otpStoreRepository.save(otpStore);

        log.info("OTP generated for email: {} — OTP: {}", email, otp);
        return otp;
    }

    @Transactional
    public boolean validateOtp(String email, String otp) {
        Optional<OtpStore> otpStore =
                otpStoreRepository.findLatestActiveOtp(email);

        if (otpStore.isEmpty()) {
            log.warn("No active OTP found for email: {}", email);
            return false;
        }

        OtpStore store = otpStore.get();

        if (store.isExpired()) {
            log.warn("OTP expired for email: {}", email);
            return false;
        }

        if (!store.getOtp().equals(otp)) {
            log.warn("Invalid OTP for email: {}", email);
            return false;
        }

        store.setUsed(true);
        otpStoreRepository.save(store);

        return true;
    }
}