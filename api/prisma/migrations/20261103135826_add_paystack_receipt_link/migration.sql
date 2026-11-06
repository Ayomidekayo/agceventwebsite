-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'SPONSORSHIP_MANAGER', 'VOLUNTEER_MANAGER', 'CONTENT_MANAGER', 'CHECK_IN_OFFICER', 'REPORT_VIEWER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_DISCUSSION', 'PROPOSAL_SENT', 'CONFIRMED', 'DECLINED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SponsorshipCommitmentStatus" AS ENUM ('PROPOSED', 'PLEDGED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'ABANDONED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('DIRECT_SPONSORSHIP', 'SPONSORSHIP_COMMITMENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('REGISTRATION_RECEIVED', 'SPONSORSHIP_ENQUIRY_RECEIVED', 'SPONSORSHIP_COMMITMENT_CREATED', 'PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'PAYMENT_RECEIPT_SUBMITTED', 'VOLUNTEER_APPLICATION_RECEIVED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "venueStatus" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "targetAttendance" INTEGER NOT NULL DEFAULT 1000,
    "registrationMode" TEXT NOT NULL DEFAULT 'FREE_PENDING_APPROVAL',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'REPORT_VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "affiliation" TEXT,
    "occupation" TEXT,
    "interest" TEXT,
    "source" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerApplication" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT,
    "occupation" TEXT,
    "department" TEXT NOT NULL,
    "experience" TEXT,
    "availability" TEXT,
    "motivation" TEXT NOT NULL,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipEnquiry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "sponsorType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisation" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "supportLevel" TEXT,
    "supportType" TEXT NOT NULL,
    "indicativeAmount" TEXT,
    "message" TEXT NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipCommitment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "sponsorName" TEXT NOT NULL,
    "supportType" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "SponsorshipCommitmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipReceipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "commitmentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "verifiedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorshipReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "biography" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sessionType" TEXT,
    "location" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "commitmentId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "providerReference" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "payerName" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "payerPhone" TEXT,
    "authorizationUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "providerResponse" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" "NotificationEvent" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_eventDate_idx" ON "Event"("status", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_role_isActive_idx" ON "AdminUser"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_tokenHash_key" ON "AdminInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminInvitation_email_expiresAt_idx" ON "AdminInvitation"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminInvitation_acceptedAt_expiresAt_idx" ON "AdminInvitation"("acceptedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_reference_key" ON "Registration"("reference");

-- CreateIndex
CREATE INDEX "Registration_eventId_createdAt_idx" ON "Registration"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");

-- CreateIndex
CREATE INDEX "Registration_lastName_firstName_idx" ON "Registration"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_email_key" ON "Registration"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerApplication_reference_key" ON "VolunteerApplication"("reference");

-- CreateIndex
CREATE INDEX "VolunteerApplication_eventId_status_createdAt_idx" ON "VolunteerApplication"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VolunteerApplication_department_idx" ON "VolunteerApplication"("department");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerApplication_eventId_email_key" ON "VolunteerApplication"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipEnquiry_reference_key" ON "SponsorshipEnquiry"("reference");

-- CreateIndex
CREATE INDEX "SponsorshipEnquiry_eventId_status_createdAt_idx" ON "SponsorshipEnquiry"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SponsorshipEnquiry_email_idx" ON "SponsorshipEnquiry"("email");

-- CreateIndex
CREATE INDEX "SponsorshipEnquiry_organisation_idx" ON "SponsorshipEnquiry"("organisation");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_eventId_status_idx" ON "SponsorshipCommitment"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorshipReceipt_paymentId_key" ON "SponsorshipReceipt"("paymentId");

-- CreateIndex
CREATE INDEX "SponsorshipReceipt_commitmentId_receivedAt_idx" ON "SponsorshipReceipt"("commitmentId", "receivedAt");

-- CreateIndex
CREATE INDEX "Speaker_eventId_isPublished_sortOrder_idx" ON "Speaker"("eventId", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "Session_eventId_isPublished_sortOrder_idx" ON "Session"("eventId", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "Payment_eventId_status_createdAt_idx" ON "Payment"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_enquiryId_idx" ON "Payment"("enquiryId");

-- CreateIndex
CREATE INDEX "Payment_commitmentId_idx" ON "Payment"("commitmentId");

-- CreateIndex
CREATE INDEX "Payment_payerEmail_createdAt_idx" ON "Payment"("payerEmail", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_idempotencyKey_key" ON "NotificationLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationLog_status_nextAttemptAt_idx" ON "NotificationLog"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "NotificationLog_eventId_createdAt_idx" ON "NotificationLog"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_entityType_entityId_idx" ON "NotificationLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerApplication" ADD CONSTRAINT "VolunteerApplication_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerApplication" ADD CONSTRAINT "VolunteerApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipEnquiry" ADD CONSTRAINT "SponsorshipEnquiry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipEnquiry" ADD CONSTRAINT "SponsorshipEnquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipCommitment" ADD CONSTRAINT "SponsorshipCommitment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipCommitment" ADD CONSTRAINT "SponsorshipCommitment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "SponsorshipEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipReceipt" ADD CONSTRAINT "SponsorshipReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipReceipt" ADD CONSTRAINT "SponsorshipReceipt_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "SponsorshipCommitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipReceipt" ADD CONSTRAINT "SponsorshipReceipt_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "SponsorshipEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "SponsorshipCommitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
