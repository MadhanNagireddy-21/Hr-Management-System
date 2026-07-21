package com.hrms.service;

import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class UserCacheService {

    private final EmployeeRepository employeeRepository;

    @PostConstruct
    public void initCache() {
        try {
            long now = System.currentTimeMillis();
            employeeRepository.findAll().forEach(emp -> {
                if (emp.getEmail() != null) {
                    cache.put(emp.getEmail().toLowerCase().trim(), new CacheEntry(emp, now));
                }
            });
            System.out.println("⚡ [UserCacheService] Successfully pre-warmed user cache with " + cache.size() + " employees!");
        } catch (Exception e) {
            System.err.println("⚠️ [UserCacheService] Could not pre-warm cache: " + e.getMessage());
        }
    }

    public static class CacheEntry {
        final Employee employee;
        final long timestamp;
        CacheEntry(Employee employee, long timestamp) {
            this.employee = employee;
            this.timestamp = timestamp;
        }
    }

    // Cache user entities in RAM for 15 minutes (900,000 ms) to eliminate redundant cross-ocean database queries
    private static final long CACHE_TTL_MS = 15 * 60 * 1000L;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public Employee getByEmail(String email) {
        if (email == null) return null;
        String key = email.toLowerCase().trim();
        CacheEntry entry = cache.get(key);
        long now = System.currentTimeMillis();
        if (entry != null && (now - entry.timestamp) < CACHE_TTL_MS) {
            return entry.employee;
        }

        Employee fetched = employeeRepository.findByEmail(key)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        cache.put(key, new CacheEntry(fetched, now));
        return fetched;
    }

    public void evict(String email) {
        if (email != null) {
            cache.remove(email.toLowerCase().trim());
        }
    }

    public void clear() {
        cache.clear();
    }
}
