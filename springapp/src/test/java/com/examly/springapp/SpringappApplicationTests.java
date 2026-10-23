package com.examly.springapp;

import org.junit.jupiter.api.Test;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;


class SpringappApplicationTests {
    private static final Path ROOT = Paths.get("src/main/java/com/examly/springapp");

    private static String readCode(String relativePath) {
        Path path = ROOT.resolve(relativePath);
        assertTrue(Files.isRegularFile(path), "Required implementation file missing: " + relativePath);
        try {
            String source = Files.readString(path, StandardCharsets.UTF_8);
            assertFalse(source.isBlank(), "Implementation file is empty: " + relativePath);
            source = source.replaceAll("(?s)/\\*.*?\\*/", " ").replaceAll("(?m)//.*$", " ");
            assertTrue(source.matches("(?s).*\\b(class|interface|enum|record)\\s+\\w+.*"),
                    "No Java type declaration in " + relativePath);
            assertTrue(source.replaceAll("\\s+", "").length() > 40,
                    "Implementation appears to be a stub: " + relativePath);
            return source;
        } catch (IOException e) {
            fail("Cannot read " + relativePath + ": " + e.getMessage());
            return "";
        }
    }

    private static String readAll(String... paths) {
        StringBuilder source = new StringBuilder();
        for (String path : paths) source.append('\n').append(readCode(path));
        return source.toString();
    }

    private static void requireAll(String source, String... tokens) {
        for (String token : tokens) {
            assertTrue(source.contains(token), "Missing implementation detail: " + token);
        }
    }

    private static void requireAny(String source, String... tokens) {
        assertTrue(Arrays.stream(tokens).anyMatch(source::contains),
                "Missing any required implementation alternative: " + Arrays.toString(tokens));
    }

    private static void requireNoAny(String source, String... forbidden) {
        for (String token : forbidden) {
            assertFalse(source.contains(token), "Forbidden client-controlled/sensitive field found: " + token);
        }
    }

    private static String readFirstExisting(String... paths) {
        List<String> errors = new ArrayList<>();
        for (String path : paths) {
            if (Files.isRegularFile(ROOT.resolve(path))) return readCode(path);
            errors.add(path);
        }
        fail("No implementation found at expected locations: " + errors);
        return "";
    }

    @Test
    void backend_testUserRegistrationBcryptCustomerRoleAndDuplicateEmailBehavior() {
        String implementation = readAll("service/impl/AuthServiceImpl.java", "controller/AuthController.java", "entity/User.java", "repository/UserRepository.java");
        requireAll(implementation, "BCryptPasswordEncoder", "PasswordEncoder", "CUSTOMER", "ACTIVE", "existsByEmail", "encode(");
    }

    @Test
    void backend_testLoginJwtClaimsExpiryInactiveUserAndGenericFailureBehavior() {
        String implementation = readAll("service/impl/AuthServiceImpl.java", "security/JwtService.java", "security/JwtUtil.java", "security/JwtTokenProvider.java", "security/JwtAuthenticationFilter.java");
        requireAll(implementation, "Invalid email or password", "role", "iat", "exp", "INACTIVE", "validateToken");
    }

    @Test
    void backend_testDefaultAdminSeedingIdempotencyAndExternalSecretConfigurationBehavior() {
        String implementation = readAll("configuration/DataInitializer.java", "configuration/AdminSeeder.java", "configuration/StartupDataLoader.java", "configuration/DefaultAdminInitializer.java", "service/impl/AuthServiceImpl.java");
        requireAll(implementation, "ADMIN", "existsByEmail", "PasswordEncoder", "encode(", "@Value", "secret");
    }

    @Test
    void backend_testUserManagementAdminOnlyRoleAndStatusChangeBehavior() {
        String implementation = readAll("controller/UserController.java", "service/impl/UserServiceImpl.java", "security/SecurityConfig.java");
        requireAll(implementation, "ADMIN", "role", "status", "save(", "@PreAuthorize");
    }

    @Test
    void backend_testLandlordCrudValidationUniqueEmailAndReferencedDeleteBehavior() {
        String implementation = readAll("controller/LandlordController.java", "service/impl/LandlordServiceImpl.java", "repository/LandlordRepository.java", "entity/Landlord.java");
        requireAll(implementation, "@Valid", "@Email", "existsByEmail", "delete", "PropertyRepository");
    }

    @Test
    void backend_testPropertyCrudValidationLandlordReferenceAndEnumBehavior() {
        String implementation = readAll("entity/Property.java", "dto/request/PropertyRequest.java", "service/impl/PropertyServiceImpl.java", "repository/LandlordRepository.java");
        requireAll(implementation, "PropertyType", "PropertyStatus", "@NotNull", "@Positive", "landlordId", "findById");
    }

    @Test
    void backend_testPropertyAvailabilityTypeCityRentAndDateRangeFilteringBehavior() {
        String implementation = readAll("controller/PropertyController.java", "service/impl/PropertyServiceImpl.java", "repository/PropertyRepository.java");
        requireAll(implementation, "available", "startDate", "endDate", "propertyType", "city", "monthlyRent", "Pageable");
    }

    @Test
    void backend_testTenantCrudIdentityUniquenessAndCustomerOwnershipBehavior() {
        String implementation = readAll("entity/Tenant.java", "dto/request/TenantRequest.java", "service/impl/TenantServiceImpl.java", "repository/TenantRepository.java");
        requireAll(implementation, "identityProofNumber", "existsByIdentityProofNumber", "existsByEmail", "@Email", "CUSTOMER", "findByUser");
    }

    @Test
    void backend_testTenantStatusRestrictionsAndAuthenticatedUserLinkBehavior() {
        String implementation = readAll("service/impl/TenantServiceImpl.java", "controller/TenantController.java", "entity/Tenant.java");
        requireAll(implementation, "ACTIVE", "SUSPENDED", "INACTIVE", "SecurityContextHolder", "setUser", "CUSTOMER");
    }

    @Test
    void backend_testLeasePlanCrudUniqueNameDurationDiscountAndReferencedDeleteBehavior() {
        String implementation = readAll("entity/LeasePlan.java", "dto/request/LeasePlanRequest.java", "service/impl/LeasePlanServiceImpl.java", "repository/LeasePlanRepository.java");
        requireAll(implementation, "durationMonths", "discountPercentage", "@Positive", "existsByName", "LeaseRepository", "delete");
    }

    @Test
    void backend_testRequestDtoValidationAndServerControlledFieldRejectionBehavior() {
        String implementation = readAll("dto/request/RegisterRequest.java", "dto/request/AuthRequest.java", "dto/request/UserRequest.java", "dto/request/LandlordRequest.java", "dto/request/PropertyRequest.java", "dto/request/TenantRequest.java", "dto/request/LeasePlanRequest.java", "dto/request/LeaseRequest.java", "dto/request/PaymentRequest.java");
        requireAll(implementation, "@NotNull", "@NotBlank", "@Email", "@Size", "@Positive", "leaseId", "propertyId", "tenantId", "leasePlanId");
    }

    @Test
    void backend_testResponseDtoSensitiveFieldExclusionAndNestedSummaryBehavior() {
        String implementation = readAll("dto/response/UserResponse.java", "dto/response/AuthResponse.java", "dto/response/LandlordResponse.java", "dto/response/PropertyResponse.java", "dto/response/TenantResponse.java", "dto/response/LeasePlanResponse.java", "dto/response/LeaseResponse.java", "dto/response/PaymentResponse.java", "dto/response/ErrorResponse.java");
        requireAll(implementation, "tokenType", "expiresIn", "LandlordSummary", "PropertySummary", "TenantSummary", "LeasePlanSummary", "LeaseSummary", "fieldErrors");
    }

    @Test
    void backend_testMapperRoundTripRelatedSummaryAndSensitiveFieldExclusionBehavior() {
        String implementation = readAll("mapper/UserMapper.java", "mapper/LandlordMapper.java", "mapper/PropertyMapper.java", "mapper/TenantMapper.java", "mapper/LeasePlanMapper.java", "mapper/LeaseMapper.java", "mapper/PaymentMapper.java");
        requireAll(implementation, "toEntity", "toResponse", "toDto", "LandlordSummary", "PropertySummary", "LeaseSummary");
    }

    @Test
    void backend_testControllerServiceRepositoryLayerSeparationBehavior() {
        String implementation = readAll("controller/AuthController.java", "controller/UserController.java", "controller/LandlordController.java", "controller/PropertyController.java", "controller/TenantController.java", "controller/LeasePlanController.java", "controller/LeaseController.java", "controller/PaymentController.java");
        requireAll(implementation, "@RestController", "Service", "@Valid", "ResponseEntity");
    }

    @Test
    void backend_testLazyManyToOneRelationshipsAndNoCircularSerializationBehavior() {
        String implementation = readAll("entity/Property.java", "entity/Tenant.java", "entity/Lease.java", "entity/Payment.java");
        requireAll(implementation, "@ManyToOne", "FetchType.LAZY", "@OneToOne", "Tenant", "Property", "LeasePlan");
    }

    @Test
    void backend_testRepositorySearchFilterPaginationSortingAllowListBehavior() {
        String implementation = readAll("repository/UserRepository.java", "repository/LandlordRepository.java", "repository/PropertyRepository.java", "repository/TenantRepository.java", "repository/LeasePlanRepository.java", "repository/LeaseRepository.java", "repository/PaymentRepository.java");
        requireAll(implementation, "JpaRepository", "Page<", "Pageable", "findBy");
    }

    @Test
    void backend_testPaginationDefaultsMaximumSizeAndMetadataBehavior() {
        String implementation = readAll("controller/LandlordController.java", "controller/PropertyController.java", "controller/TenantController.java", "controller/LeasePlanController.java", "controller/LeaseController.java", "controller/PaymentController.java");
        requireAll(implementation, "Pageable", "page", "size", "totalElements", "totalPages");
    }

    @Test
    void backend_testLeaseCreationActiveTenantAvailablePropertyAndExistingPlanBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "repository/TenantRepository.java", "repository/PropertyRepository.java", "repository/LeasePlanRepository.java");
        requireAll(implementation, "ACTIVE", "MAINTENANCE", "INACTIVE", "AVAILABLE", "tenant", "property", "leasePlan", "RESERVED");
    }

    @Test
    void backend_testLeaseExpectedEndDateDerivationAndMismatchRejectionBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "entity/LeasePlan.java");
        requireAll(implementation, "expectedEndDate", "leaseStartDate", "durationMonths", "plusMonths", "isAfter");
    }

    @Test
    void backend_testLeaseOverlapPreventionReservedActiveAndOverdueBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "repository/LeaseRepository.java");
        requireAll(implementation, "RESERVED", "ACTIVE", "OVERDUE", "leaseStartDate", "expectedEndDate", "property");
    }

    @Test
    void backend_testConcurrentLeaseCreationPropertyLockAndTransactionBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "repository/PropertyRepository.java", "repository/LeaseRepository.java");
        requireAll(implementation, "@Transactional", "@Lock", "PESSIMISTIC_WRITE", "overlap");
    }

    @Test
    void backend_testLeasePricingBaseDiscountTotalAndSecurityDepositSeparationBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "entity/Property.java", "entity/LeasePlan.java", "entity/Lease.java");
        requireAll(implementation, "monthlyRent", "durationMonths", "discountPercentage", "baseAmount", "discountAmount", "lateFee", "totalAmount", "securityDeposit");
    }

    @Test
    void backend_testLeaseActivationRechecksTenantAndPropertyAvailabilityBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java");
        requireAll(implementation, "activate", "ACTIVE", "AVAILABLE", "tenant", "RESERVED");
    }

    @Test
    void backend_testLeaseStatusTransitionMatrixAndConflictResponseBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "exception/GlobalExceptionHandler.java");
        requireAll(implementation, "RESERVED", "ACTIVE", "COMPLETED", "TERMINATED", "CANCELLED", "OVERDUE", "Invalid lease transition", "CONFLICT");
    }

    @Test
    void backend_testLeaseCompletionActualEndDateLateFeeAndPropertyAvailabilityBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java");
        requireAll(implementation, "complete", "actualEndDate", "lateFee", "totalAmount", "OVERDUE", "AVAILABLE", "RENTED");
    }

    @Test
    void backend_testLeaseTerminationActualEndDateFeeAndPropertyStatusBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java");
        requireAll(implementation, "terminate", "actualEndDate", "lateFee", "totalAmount", "RENTED", "AVAILABLE", "TERMINATED");
    }

    @Test
    void backend_testLeaseCancellationRulesAndNoAutomaticRefundBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java");
        requireAll(implementation, "cancel", "CANCELLED", "RESERVED", "PaymentService");
    }

    @Test
    void backend_testLeaseOverdueScheduledDetectionAndReadTimeEvaluationBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "configuration/OverdueLeaseScheduler.java", "configuration/ScheduledTasks.java", "service/impl/LeaseScheduler.java");
        requireAll(implementation, "@Scheduled", "OVERDUE", "expectedEndDate", "LocalDate.now", "lateFee");
    }

    @Test
    void backend_testLeaseLateFeeConfigurationAndAccrualPersistenceBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "configuration/LeaseConfiguration.java", "configuration/LeaseProperties.java");
        requireAll(implementation, "dailyLateFee", "100.00", "lateFee", "overdueDays", "save(");
    }

    @Test
    void backend_testReservedLeaseUpdateAndNonReservedUpdateRejectionBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "controller/LeaseController.java");
        requireAll(implementation, "RESERVED", "update", "expectedEndDate", "CONFLICT", "Invalid lease transition");
    }

    @Test
    void backend_testProtectedEntityDeletionConflictForPropertyLandlordTenantAndPlanBehavior() {
        String implementation = readAll("service/impl/PropertyServiceImpl.java", "service/impl/LandlordServiceImpl.java", "service/impl/TenantServiceImpl.java", "service/impl/LeasePlanServiceImpl.java");
        requireAll(implementation, "LeaseRepository", "delete", "Conflict");
    }

    @Test
    void backend_testPaymentCreationPendingTimestampAndAmountValidationBehavior() {
        String implementation = readAll("service/impl/PaymentServiceImpl.java", "entity/Payment.java");
        requireAll(implementation, "PENDING", "LocalDateTime.now", "paymentDate", "amount", "PaymentMethod", "save(");
    }

    @Test
    void backend_testPaymentOutstandingBalanceAndSuccessfulPaymentAggregationBehavior() {
        String implementation = readAll("service/impl/PaymentServiceImpl.java", "repository/PaymentRepository.java", "service/impl/LeaseServiceImpl.java");
        requireAll(implementation, "totalAmount", "SUCCESS", "amount", "balanceDue", "findByLease");
    }

    @Test
    void backend_testPaymentProcessingSuccessFailureAndUniqueReferenceBehavior() {
        String implementation = readAll("service/impl/PaymentServiceImpl.java", "entity/Payment.java");
        requireAll(implementation, "process", "SUCCESS", "FAILED", "transactionReference", "PENDING");
    }

    @Test
    void backend_testFailedPaymentRetryAndPaidAmountExclusionBehavior() {
        String implementation = readAll("service/impl/PaymentServiceImpl.java", "repository/PaymentRepository.java");
        requireAll(implementation, "FAILED", "SUCCESS", "PENDING", "findByLease", "amount");
    }

    @Test
    void backend_testPaymentRefundSuccessOnlyAndDuplicateRefundConflictBehavior() {
        String implementation = readAll("service/impl/PaymentServiceImpl.java");
        requireAll(implementation, "refund", "SUCCESS", "REFUNDED", "CONFLICT", "status", "save(");
    }

    @Test
    void backend_testPaymentClientControlledStatusDateAndReferenceRejectionBehavior() {
        String implementation = readAll("dto/request/PaymentRequest.java", "service/impl/PaymentServiceImpl.java", "mapper/PaymentMapper.java");
        requireAll(implementation, "leaseId", "amount", "paymentMethod", "PENDING", "paymentDate", "transactionReference");
    }

    @Test
    void backend_testCustomerLeaseAndPaymentOwnershipListAndDetailAuthorizationBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "service/impl/PaymentServiceImpl.java", "controller/LeaseController.java", "controller/PaymentController.java");
        requireAll(implementation, "CUSTOMER", "SecurityContextHolder", "tenant", "lease", "403", "user");
    }

    @Test
    void backend_testRoleAuthorizationAdminStaffCustomerAndUnauthenticatedBehavior() {
        String implementation = readAll("security/SecurityConfig.java", "security/JwtAuthenticationFilter.java", "controller/UserController.java", "controller/PropertyController.java", "controller/TenantController.java");
        requireAll(implementation, "ADMIN", "STAFF", "CUSTOMER", "hasRole", "authenticated", "permitAll");
    }

    @Test
    void backend_testJwtInvalidExpiredTamperedAndDeactivatedAccountRejectionBehavior() {
        String implementation = readAll("security/JwtService.java", "security/JwtUtil.java", "security/JwtTokenProvider.java", "security/JwtAuthenticationFilter.java");
        requireAll(implementation, "validateToken", "isTokenExpired", "Claims", "INACTIVE", "401");
    }

    @Test
    void backend_testGlobalValidationExceptionAndStandardErrorResponseBehavior() {
        String implementation = readAll("exception/GlobalExceptionHandler.java", "dto/response/ErrorResponse.java");
        requireAll(implementation, "@ControllerAdvice", "MethodArgumentNotValidException", "timestamp", "status", "error", "message", "path", "fieldErrors");
    }

    @Test
    void backend_testSecurityErrorResponsesWithoutStackTraceOrSensitiveDetailsBehavior() {
        String implementation = readAll("security/SecurityConfig.java", "security/JwtAuthenticationEntryPoint.java", "security/CustomAuthenticationEntryPoint.java", "security/RestAuthenticationEntryPoint.java", "security/CustomAccessDeniedHandler.java", "exception/GlobalExceptionHandler.java");
        requireAll(implementation, "401", "403", "message", "path");
    }

    @Test
    void backend_testCorsConfigurableOriginMethodsAndAllowedHeadersBehavior() {
        String implementation = readAll("configuration/CorsConfig.java", "configuration/WebConfig.java", "security/SecurityConfig.java");
        requireAll(implementation, "CorsConfiguration", "allowedOrigins", "GET", "POST", "PUT", "DELETE", "OPTIONS", "Authorization", "Content-Type");
    }

    @Test
    void backend_testSwaggerOpenApiJwtSecurityRolesAndDtoDocumentationBehavior() {
        String implementation = readAll("configuration/OpenApiConfig.java", "configuration/SwaggerConfig.java", "controller/AuthController.java", "controller/UserController.java", "controller/LandlordController.java", "controller/PropertyController.java", "controller/TenantController.java", "controller/LeasePlanController.java", "controller/LeaseController.java", "controller/PaymentController.java");
        requireAll(implementation, "OpenAPI", "SecurityScheme", "bearer", "JWT", "@Operation");
    }

    @Test
    void backend_testAllModuleRestApiCrudSearchFilterAndHttpStatusContractBehavior() {
        String implementation = readAll("controller/UserController.java", "controller/LandlordController.java", "controller/PropertyController.java", "controller/TenantController.java", "controller/LeasePlanController.java", "controller/LeaseController.java", "controller/PaymentController.java");
        requireAll(implementation, "@RestController", "@GetMapping", "@PostMapping", "@PutMapping", "@DeleteMapping", "ResponseEntity");
    }

    @Test
    void backend_testPropertyStatusTransitionsPreserveMaintenanceAndInactiveBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "service/impl/PropertyServiceImpl.java");
        requireAll(implementation, "RENTED", "AVAILABLE", "MAINTENANCE", "INACTIVE", "setStatus", "getStatus");
    }

    @Test
    void backend_testLeasePaymentAmountPaidBalanceAndRefundConsistencyBehavior() {
        String implementation = readAll("service/impl/LeaseServiceImpl.java", "service/impl/PaymentServiceImpl.java", "dto/response/LeaseResponse.java");
        requireAll(implementation, "totalAmount", "amountPaid", "balanceDue", "SUCCESS", "REFUNDED", "refund");
    }

    @Test
    void backend_testMySqlPersistenceAndRestartDataIntegrityBehavior() {
        String implementation = readAll("entity/User.java", "entity/Landlord.java", "entity/Property.java", "entity/Tenant.java", "entity/LeasePlan.java", "entity/Lease.java", "entity/Payment.java", "repository/UserRepository.java", "repository/LandlordRepository.java", "repository/PropertyRepository.java", "repository/TenantRepository.java", "repository/LeasePlanRepository.java", "repository/LeaseRepository.java", "repository/PaymentRepository.java");
        requireAll(implementation, "@Entity", "@Id", "@GeneratedValue", "JpaRepository");
    }

    @Test
    void backend_testServiceInterfaceImplementationAndControllerServiceDelegationBehavior() {
        String implementation = readAll("service/AuthService.java", "service/UserService.java", "service/LandlordService.java", "service/PropertyService.java", "service/TenantService.java", "service/LeasePlanService.java", "service/LeaseService.java", "service/PaymentService.java", "service/impl/AuthServiceImpl.java", "service/impl/UserServiceImpl.java", "service/impl/LandlordServiceImpl.java", "service/impl/PropertyServiceImpl.java", "service/impl/TenantServiceImpl.java", "service/impl/LeasePlanServiceImpl.java", "service/impl/LeaseServiceImpl.java", "service/impl/PaymentServiceImpl.java");
        requireAll(implementation, "interface", "implements", "@Service", "Repository", "save(");
    }

    @Test
    void backend_testCompleteAuthenticationLeasePaymentAndDatabaseIntegrationBehavior() {
        String implementation = readAll("controller/AuthController.java", "controller/LeaseController.java", "controller/PaymentController.java", "service/impl/AuthServiceImpl.java", "service/impl/LeaseServiceImpl.java", "service/impl/PaymentServiceImpl.java", "entity/User.java", "entity/Lease.java", "entity/Payment.java");
        requireAll(implementation, "@RestController", "@Transactional", "BCryptPasswordEncoder", "JpaRepository", "RESERVED", "PENDING", "SUCCESS");
    }

}
