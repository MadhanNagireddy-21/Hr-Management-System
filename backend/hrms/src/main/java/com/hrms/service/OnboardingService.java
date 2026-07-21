package com.hrms.service;

import com.hrms.dto.OnboardingDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Onboarding;
import com.hrms.entity.Onboarding.OnboardingStatus;
import com.hrms.repository.OnboardingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final OnboardingRepository onboardingRepo;
    private final EmployeeService employeeService;

    @Transactional
    public OnboardingDTOs.Response initOnboarding(Long employeeId, Long hrId) {
        Employee employee = employeeService.findById(employeeId);
        Employee hr       = employeeService.findById(hrId);

        if (onboardingRepo.findByEmployee(employee).isPresent()) {
            throw new IllegalStateException("Onboarding already exists for this employee");
        }

        Onboarding onboarding = Onboarding.builder()
                .employee(employee)
                .joiningDate(employee.getDateOfJoining())
                .status(OnboardingStatus.PENDING)
                .assignedHr(hr)
                .offerLetterSigned(false)
                .idProofSubmitted(false)
                .addressProofSubmitted(false)
                .educationDocsSubmitted(false)
                .bankDetailsSubmitted(false)
                .pfFormSubmitted(false)
                .esiFormSubmitted(false)
                .ndaSigned(false)
                .laptopIssued(false)
                .emailCreated(false)
                .systemAccessGiven(false)
                .build();

        return toResponse(onboardingRepo.save(onboarding));
    }

    @Transactional
    public OnboardingDTOs.Response updateOnboarding(Long onboardingId,
                                                    OnboardingDTOs.UpdateRequest req) {
        Onboarding o = findById(onboardingId);

        if (req.getOfferLetterSigned()      != null) o.setOfferLetterSigned(req.getOfferLetterSigned());
        if (req.getIdProofSubmitted()        != null) o.setIdProofSubmitted(req.getIdProofSubmitted());
        if (req.getAddressProofSubmitted()   != null) o.setAddressProofSubmitted(req.getAddressProofSubmitted());
        if (req.getEducationDocsSubmitted()  != null) o.setEducationDocsSubmitted(req.getEducationDocsSubmitted());
        if (req.getBankDetailsSubmitted()    != null) o.setBankDetailsSubmitted(req.getBankDetailsSubmitted());
        if (req.getPfFormSubmitted()         != null) o.setPfFormSubmitted(req.getPfFormSubmitted());
        if (req.getEsiFormSubmitted()        != null) o.setEsiFormSubmitted(req.getEsiFormSubmitted());
        if (req.getNdaSigned()               != null) o.setNdaSigned(req.getNdaSigned());
        if (req.getLaptopIssued()            != null) o.setLaptopIssued(req.getLaptopIssued());
        if (req.getEmailCreated()            != null) o.setEmailCreated(req.getEmailCreated());
        if (req.getSystemAccessGiven()       != null) o.setSystemAccessGiven(req.getSystemAccessGiven());
        if (req.getRemarks()                 != null) o.setRemarks(req.getRemarks());
        if (req.getStatus()                  != null) o.setStatus(req.getStatus());

        // Auto-complete if all checklist items done
        if (allChecked(o)) o.setStatus(OnboardingStatus.COMPLETED);
        else if (o.getStatus() == OnboardingStatus.PENDING) o.setStatus(OnboardingStatus.IN_PROGRESS);

        return toResponse(onboardingRepo.save(o));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public OnboardingDTOs.Response getByEmployeeId(Long employeeId) {
        Employee emp = employeeService.findById(employeeId);
        return toResponse(onboardingRepo.findByEmployee(emp)
                .orElseThrow(() -> new NoSuchElementException("No onboarding found for employee")));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<OnboardingDTOs.Response> getAll(Pageable pageable) {
        return onboardingRepo.findAll(pageable).map(this::toResponse);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<OnboardingDTOs.Response> getPending(Pageable pageable) {
        Page<OnboardingDTOs.Response> result = onboardingRepo
                .findByStatus(OnboardingStatus.PENDING, pageable)
                .map(this::toResponse);
        if (result.isEmpty()) {
            throw new com.hrms.exception.NoRecordsFoundException(
                    "No pending onboarding records found");
        }
        return result;
    }

    private boolean allChecked(Onboarding o) {
        return Boolean.TRUE.equals(o.getOfferLetterSigned())
                && Boolean.TRUE.equals(o.getIdProofSubmitted())
                && Boolean.TRUE.equals(o.getAddressProofSubmitted())
                && Boolean.TRUE.equals(o.getEducationDocsSubmitted())
                && Boolean.TRUE.equals(o.getBankDetailsSubmitted())
                && Boolean.TRUE.equals(o.getPfFormSubmitted())
                && Boolean.TRUE.equals(o.getNdaSigned())
                && Boolean.TRUE.equals(o.getLaptopIssued())
                && Boolean.TRUE.equals(o.getEmailCreated())
                && Boolean.TRUE.equals(o.getSystemAccessGiven());
    }

    private int completionPercent(Onboarding o) {
        int total = 11, done = 0;
        if (Boolean.TRUE.equals(o.getOfferLetterSigned()))      done++;
        if (Boolean.TRUE.equals(o.getIdProofSubmitted()))        done++;
        if (Boolean.TRUE.equals(o.getAddressProofSubmitted()))   done++;
        if (Boolean.TRUE.equals(o.getEducationDocsSubmitted()))  done++;
        if (Boolean.TRUE.equals(o.getBankDetailsSubmitted()))    done++;
        if (Boolean.TRUE.equals(o.getPfFormSubmitted()))         done++;
        if (Boolean.TRUE.equals(o.getEsiFormSubmitted()))        done++;
        if (Boolean.TRUE.equals(o.getNdaSigned()))               done++;
        if (Boolean.TRUE.equals(o.getLaptopIssued()))            done++;
        if (Boolean.TRUE.equals(o.getEmailCreated()))            done++;
        if (Boolean.TRUE.equals(o.getSystemAccessGiven()))       done++;
        return (done * 100) / total;
    }

    private Onboarding findById(Long id) {
        return onboardingRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Onboarding not found: " + id));
    }

    private OnboardingDTOs.Response toResponse(Onboarding o) {
        OnboardingDTOs.Response r = new OnboardingDTOs.Response();
        r.setId(o.getId());
        r.setEmployeeId(o.getEmployee().getId());
        r.setEmployeeName(o.getEmployee().getFirstName() + " " + o.getEmployee().getLastName());
        r.setEmployeeCode(o.getEmployee().getEmployeeId());
        r.setDepartment(o.getEmployee().getDepartment());
        r.setJoiningDate(o.getJoiningDate());
        r.setStatus(o.getStatus());
        r.setCompletionPercent(completionPercent(o));
        r.setOfferLetterSigned(o.getOfferLetterSigned());
        r.setIdProofSubmitted(o.getIdProofSubmitted());
        r.setAddressProofSubmitted(o.getAddressProofSubmitted());
        r.setEducationDocsSubmitted(o.getEducationDocsSubmitted());
        r.setBankDetailsSubmitted(o.getBankDetailsSubmitted());
        r.setPfFormSubmitted(o.getPfFormSubmitted());
        r.setEsiFormSubmitted(o.getEsiFormSubmitted());
        r.setNdaSigned(o.getNdaSigned());
        r.setLaptopIssued(o.getLaptopIssued());
        r.setEmailCreated(o.getEmailCreated());
        r.setSystemAccessGiven(o.getSystemAccessGiven());
        r.setRemarks(o.getRemarks());
        if (o.getAssignedHr() != null) {
            r.setAssignedHrName(o.getAssignedHr().getFirstName() + " " + o.getAssignedHr().getLastName());
        }
        r.setCreatedAt(o.getCreatedAt());
        return r;
    }
}