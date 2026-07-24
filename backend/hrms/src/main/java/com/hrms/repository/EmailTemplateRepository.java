package com.hrms.repository;

import com.hrms.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Integer> {

    Optional<EmailTemplate> findByTemplateName(String templateName);

    List<EmailTemplate> findByIsActiveTrue();

    boolean existsByTemplateName(String templateName);
}