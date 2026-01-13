/*
  Warnings:

  - You are about to drop the column `approved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nextDueDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompanySettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profession` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `approved`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `emailVerified`,
    DROP COLUMN `image`,
    DROP COLUMN `nextDueDate`,
    DROP COLUMN `paymentId`,
    DROP COLUMN `plan`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `googleAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `googleEmail` VARCHAR(191) NULL,
    ADD COLUMN `googleRefreshToken` VARCHAR(191) NULL,
    ADD COLUMN `resetPasswordExpiry` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL,
    MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `password` VARCHAR(191) NOT NULL,
    MODIFY `profession` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Account`;

-- DropTable
DROP TABLE `CompanySettings`;

-- DropTable
DROP TABLE `PasswordResetToken`;

-- DropTable
DROP TABLE `Session`;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `googleAccessToken` TEXT NULL,
    `googleEmail` VARCHAR(191) NULL,
    `googleRefreshToken` TEXT NULL,
    `directorId` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cpf` VARCHAR(191) NULL DEFAULT '',
    `phone` VARCHAR(191) NULL DEFAULT '',
    `birthDate` VARCHAR(191) NULL,
    `cnpj` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `accessStatus` VARCHAR(191) NULL DEFAULT 'pending',
    `requestedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resetPasswordToken` VARCHAR(191) NULL,
    `resetPasswordExpiry` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NULL,
    `companyName` VARCHAR(191) NULL,
    `companyCnpj` VARCHAR(191) NULL,
    `companyPhone` VARCHAR(191) NULL,
    `companyEmail` VARCHAR(191) NULL,
    `companyAddress` VARCHAR(191) NULL,
    `companyWebsite` VARCHAR(191) NULL,
    `companyDescription` VARCHAR(191) NULL,
    `companyLogo` VARCHAR(191) NULL,
    `companySize` VARCHAR(191) NULL,
    `companySector` VARCHAR(191) NULL,
    `companyFounded` VARCHAR(191) NULL,
    `companyRevenue` VARCHAR(191) NULL,
    `companyEmployees` VARCHAR(191) NULL,

    UNIQUE INDEX `Team_email_key`(`email`),
    INDEX `Team_teamId_fkey`(`teamId`),
    INDEX `Team_directorId_fkey`(`directorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamGroup_managerId_fkey`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamPermission` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `dashboard` BOOLEAN NOT NULL DEFAULT false,
    `whatsapp` BOOLEAN NOT NULL DEFAULT false,
    `propostas` BOOLEAN NOT NULL DEFAULT false,
    `simuladores` BOOLEAN NOT NULL DEFAULT false,
    `relatorios` BOOLEAN NOT NULL DEFAULT false,
    `campanhas` BOOLEAN NOT NULL DEFAULT false,
    `equipe` BOOLEAN NOT NULL DEFAULT false,
    `configuracoes` BOOLEAN NOT NULL DEFAULT false,

    INDEX `TeamPermission_teamId_fkey`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `ocupation` VARCHAR(191) NOT NULL,
    `potentialValue` VARCHAR(191) NOT NULL,
    `observations` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'novos_leads',
    `product` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Lead_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proposal` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `client` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL DEFAULT 'pendente_envio',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `dueDate` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `arquivoUrl` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `acrescentarSeguro` BOOLEAN NULL,
    `creditoUnitario` DOUBLE NULL,
    `mesContemplacao` INTEGER NULL,
    `opcaoParcela` VARCHAR(191) NULL,
    `parcelaContemplacao` DOUBLE NULL,
    `prazoConsorcio` INTEGER NULL,
    `taxa` DOUBLE NULL,

    INDEX `Proposal_leadId_fkey`(`leadId`),
    INDEX `Proposal_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proponent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `razaoSocial` VARCHAR(191) NULL,
    `nomeEmpresa` VARCHAR(191) NULL,
    `dataNascimento` VARCHAR(191) NULL,
    `ocupacao` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `cidadeUf` VARCHAR(191) NULL,
    `rendaMensal` VARCHAR(191) NULL,
    `cnpj` VARCHAR(191) NULL,
    `proposalId` VARCHAR(191) NOT NULL,

    INDEX `Proponent_proposalId_fkey`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `neighborhood` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `value` VARCHAR(191) NOT NULL,
    `creditValue` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `proposalId` VARCHAR(191) NOT NULL,

    INDEX `Property_proposalId_fkey`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyOwner` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,

    INDEX `PropertyOwner_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProposalFile` (
    `id` VARCHAR(191) NOT NULL,
    `url` TEXT NULL,
    `name` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `documentType` VARCHAR(191) NULL,
    `fileData` LONGBLOB NULL,
    `mimeType` VARCHAR(191) NULL,
    `originalName` VARCHAR(191) NULL,
    `size` INTEGER NULL,

    INDEX `ProposalFile_proposalId_fkey`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `type` VARCHAR(191) NOT NULL DEFAULT 'meet',
    `status` VARCHAR(191) NOT NULL DEFAULT 'confirmed',
    `meetLink` VARCHAR(191) NULL,
    `attendees` VARCHAR(191) NULL,
    `organizerEmail` VARCHAR(191) NOT NULL,
    `googleEventId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Meeting_organizerEmail_idx`(`organizerEmail`),
    INDEX `Meeting_startDateTime_idx`(`startDateTime`),
    INDEX `Meeting_googleEventId_idx`(`googleEventId`),
    INDEX `Meeting_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Followup` (
    `id` VARCHAR(191) NOT NULL,
    `observations` VARCHAR(191) NOT NULL,
    `tipeOfContact` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `dateNextContact` DATETIME(3) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,

    INDEX `Followup_leadId_fkey`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Simulation` (
    `id` VARCHAR(191) NOT NULL,
    `creditoUnitario` DOUBLE NOT NULL,
    `taxa` DOUBLE NOT NULL,
    `prazoConsorcio` INTEGER NOT NULL,
    `opcaoParcela` VARCHAR(191) NOT NULL,
    `parcelaContemplacao` DOUBLE NULL,
    `mesContemplacao` INTEGER NULL,
    `acrescentarSeguro` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `proposalId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,

    INDEX `Simulation_proposalId_fkey`(`proposalId`),
    INDEX `Simulation_leadId_fkey`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` VARCHAR(191) NOT NULL,
    `idfromWpp` TEXT NOT NULL,
    `body` TEXT NULL,
    `timestamp` VARCHAR(191) NULL,
    `notifyName` VARCHAR(191) NULL,
    `from` VARCHAR(191) NULL,
    `to` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `foto` VARCHAR(191) NULL,
    `mediaUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppSession` (
    `id` VARCHAR(191) NOT NULL,
    `sessionName` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `connectionStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCONNECTED',
    `qrCode` TEXT NULL,
    `lastConnected` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `formattedNumber` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WhatsAppSession_sessionName_key`(`sessionName`),
    INDEX `WhatsAppSession_sessionName_idx`(`sessionName`),
    INDEX `WhatsAppSession_isActive_idx`(`isActive`),
    INDEX `WhatsAppSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppContact` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `formattedPhone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `profilePic` TEXT NULL,
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `sessionId` VARCHAR(191) NOT NULL,
    `assignedToUserId` INTEGER NULL,
    `assignedAt` DATETIME(3) NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsAppContact_phone_idx`(`phone`),
    INDEX `WhatsAppContact_sessionId_idx`(`sessionId`),
    INDEX `WhatsAppContact_assignedToUserId_idx`(`assignedToUserId`),
    INDEX `WhatsAppContact_lastMessageAt_idx`(`lastMessageAt`),
    UNIQUE INDEX `WhatsAppContact_phone_sessionId_key`(`phone`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppMessage` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `chatId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `fromMe` BOOLEAN NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `body` TEXT NULL,
    `quotedMsgId` VARCHAR(191) NULL,
    `mediaUrl` LONGTEXT NULL,
    `mediaType` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `caption` TEXT NULL,
    `isForwarded` BOOLEAN NOT NULL DEFAULT false,
    `isStatus` BOOLEAN NOT NULL DEFAULT false,
    `isGroupMsg` BOOLEAN NOT NULL DEFAULT false,
    `author` VARCHAR(191) NULL,
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppMessage_messageId_key`(`messageId`),
    INDEX `WhatsAppMessage_messageId_idx`(`messageId`),
    INDEX `WhatsAppMessage_chatId_idx`(`chatId`),
    INDEX `WhatsAppMessage_sessionId_idx`(`sessionId`),
    INDEX `WhatsAppMessage_contactId_idx`(`contactId`),
    INDEX `WhatsAppMessage_contactPhone_idx`(`contactPhone`),
    INDEX `WhatsAppMessage_timestamp_idx`(`timestamp`),
    INDEX `WhatsAppMessage_fromMe_idx`(`fromMe`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppTag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#007bff',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppTag_name_key`(`name`),
    INDEX `WhatsAppTag_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppContactTag` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WhatsAppContactTag_contactId_idx`(`contactId`),
    INDEX `WhatsAppContactTag_tagId_idx`(`tagId`),
    UNIQUE INDEX `WhatsAppContactTag_contactId_tagId_key`(`contactId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaing` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `delay` INTEGER NOT NULL DEFAULT 30000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contactDelay` INTEGER NOT NULL DEFAULT 10000,
    `userId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `deletedAt` DATETIME(3) NULL,

    INDEX `Campaing_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `userId` VARCHAR(191) NULL,

    INDEX `Template_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemplateMessage` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NULL,
    `audioUrl` TEXT NULL,
    `imageUrl` TEXT NULL,
    `documentUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `videoUrl` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `TemplateMessage_templateId_fkey`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaingTemplate` (
    `campaingId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,

    INDEX `CampaingTemplate_templateId_fkey`(`templateId`),
    PRIMARY KEY (`campaingId`, `templateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KbMessage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `citations` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KbMessage_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Segment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Segment_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SegmentContact` (
    `id` VARCHAR(191) NOT NULL,
    `segmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `empresa` VARCHAR(191) NULL,
    `extraData` JSON NULL,

    INDEX `SegmentContact_segmentId_fkey`(`segmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignDispatch` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `sessionName` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `error` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `messageOrder` INTEGER NULL,
    `scheduledAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuickReply` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `audioUrl` TEXT NULL,
    `documentUrl` TEXT NULL,
    `imageUrl` TEXT NULL,
    `videoUrl` TEXT NULL,

    INDEX `QuickReply_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadFile` (
    `id` VARCHAR(191) NOT NULL,
    `url` TEXT NULL,
    `name` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `documentType` VARCHAR(191) NULL,
    `fileData` LONGBLOB NULL,
    `mimeType` VARCHAR(191) NULL,
    `originalName` VARCHAR(191) NULL,
    `size` INTEGER NULL,

    INDEX `LeadFile_leadId_fkey`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIConfig` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `assistantName` VARCHAR(191) NOT NULL DEFAULT 'Agnes',
    `assistantRole` VARCHAR(191) NOT NULL DEFAULT 'assistente virtual',
    `assistantTeam` VARCHAR(191) NOT NULL DEFAULT 'equipe do Dr. Marcelo',
    `assistantContext` TEXT NOT NULL,
    `greetingMessage` TEXT NOT NULL,
    `appointmentFlow` TEXT NOT NULL,
    `confirmationMessage` TEXT NOT NULL,
    `generalRules` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIConfig_userId_idx`(`userId`),
    UNIQUE INDEX `AIConfig_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `TeamGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamGroup` ADD CONSTRAINT `TeamGroup_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamPermission` ADD CONSTRAINT `TeamPermission_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proponent` ADD CONSTRAINT `Proponent_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyOwner` ADD CONSTRAINT `PropertyOwner_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProposalFile` ADD CONSTRAINT `ProposalFile_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_organizerEmail_fkey` FOREIGN KEY (`organizerEmail`) REFERENCES `Team`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Followup` ADD CONSTRAINT `Followup_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Simulation` ADD CONSTRAINT `Simulation_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Simulation` ADD CONSTRAINT `Simulation_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppSession` ADD CONSTRAINT `WhatsAppSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppContact` ADD CONSTRAINT `WhatsAppContact_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WhatsAppSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppMessage` ADD CONSTRAINT `WhatsAppMessage_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `WhatsAppContact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppMessage` ADD CONSTRAINT `WhatsAppMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WhatsAppSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppContactTag` ADD CONSTRAINT `WhatsAppContactTag_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `WhatsAppContact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppContactTag` ADD CONSTRAINT `WhatsAppContactTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `WhatsAppTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campaing` ADD CONSTRAINT `Campaing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Template` ADD CONSTRAINT `Template_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateMessage` ADD CONSTRAINT `TemplateMessage_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaingTemplate` ADD CONSTRAINT `CampaingTemplate_campaingId_fkey` FOREIGN KEY (`campaingId`) REFERENCES `Campaing`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaingTemplate` ADD CONSTRAINT `CampaingTemplate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Segment` ADD CONSTRAINT `Segment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SegmentContact` ADD CONSTRAINT `SegmentContact_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `Segment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuickReply` ADD CONSTRAINT `QuickReply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadFile` ADD CONSTRAINT `LeadFile_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIConfig` ADD CONSTRAINT `AIConfig_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
