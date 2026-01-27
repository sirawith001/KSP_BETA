-- CreateTable
CREATE TABLE `warduser` (
    `wardid` INTEGER NOT NULL AUTO_INCREMENT,
    `warduser` VARCHAR(191) NOT NULL,
    `wardpass` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `department` ENUM('USER', 'ADMINMINI', 'OPD', 'ER') NOT NULL DEFAULT 'USER',
    `wardname` VARCHAR(191) NULL,
    `wardstatus` VARCHAR(191) NULL,
    `warddest` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `warduser_warduser_key`(`warduser`),
    PRIMARY KEY (`wardid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workcat` (
    `catid` INTEGER NOT NULL AUTO_INCREMENT,
    `catname` VARCHAR(191) NOT NULL,
    `catnameopd` VARCHAR(191) NULL,
    `catnameer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workcat_catname_key`(`catname`),
    PRIMARY KEY (`catid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workadd` (
    `wid` INTEGER NOT NULL AUTO_INCREMENT,
    `ws1` INTEGER NOT NULL DEFAULT 0,
    `ws2` INTEGER NOT NULL DEFAULT 0,
    `ws3` INTEGER NOT NULL DEFAULT 0,
    `ws4` INTEGER NOT NULL DEFAULT 0,
    `ws5` INTEGER NOT NULL DEFAULT 0,
    `ws6` INTEGER NOT NULL DEFAULT 0,
    `ws7` INTEGER NOT NULL DEFAULT 0,
    `ws8` INTEGER NOT NULL DEFAULT 0,
    `ws9` INTEGER NOT NULL DEFAULT 0,
    `ws10` INTEGER NOT NULL DEFAULT 0,
    `wa1` INTEGER NOT NULL DEFAULT 0,
    `wa2` INTEGER NOT NULL DEFAULT 0,
    `wa11` INTEGER NOT NULL DEFAULT 0,
    `wa22` INTEGER NOT NULL DEFAULT 0,
    `wdc1` INTEGER NOT NULL DEFAULT 0,
    `wdc2` INTEGER NOT NULL DEFAULT 0,
    `wdc3` INTEGER NOT NULL DEFAULT 0,
    `wdc4` INTEGER NOT NULL DEFAULT 0,
    `wdc5` INTEGER NOT NULL DEFAULT 0,
    `wdc6` INTEGER NOT NULL DEFAULT 0,
    `wdc7` INTEGER NOT NULL DEFAULT 0,
    `wdc11` INTEGER NOT NULL DEFAULT 0,
    `wdc22` INTEGER NOT NULL DEFAULT 0,
    `wdc33` INTEGER NOT NULL DEFAULT 0,
    `wdc44` INTEGER NOT NULL DEFAULT 0,
    `wdc55` INTEGER NOT NULL DEFAULT 0,
    `wdc66` INTEGER NOT NULL DEFAULT 0,
    `wdc77` INTEGER NOT NULL DEFAULT 0,
    `wn1` INTEGER NOT NULL DEFAULT 0,
    `wrn1` INTEGER NOT NULL DEFAULT 0,
    `wrn2` INTEGER NOT NULL DEFAULT 0,
    `wpn1` INTEGER NOT NULL DEFAULT 0,
    `wpn2` INTEGER NOT NULL DEFAULT 0,
    `wna1` INTEGER NOT NULL DEFAULT 0,
    `wna2` INTEGER NOT NULL DEFAULT 0,
    `catid` INTEGER NOT NULL,
    `wardid` INTEGER NOT NULL,
    `wdates` DATETIME(3) NOT NULL,
    `wdateth` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `workadd_wdates_idx`(`wdates`),
    INDEX `workadd_wardid_idx`(`wardid`),
    INDEX `workadd_catid_idx`(`catid`),
    PRIMARY KEY (`wid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workaddout` (
    `woid` INTEGER NOT NULL AUTO_INCREMENT,
    `wardid` INTEGER NOT NULL,
    `wo1` INTEGER NOT NULL DEFAULT 0,
    `wo2` INTEGER NOT NULL DEFAULT 0,
    `wo3` INTEGER NOT NULL DEFAULT 0,
    `wo4` INTEGER NOT NULL DEFAULT 0,
    `wo5` INTEGER NOT NULL DEFAULT 0,
    `wocomment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `workaddout_wardid_idx`(`wardid`),
    PRIMARY KEY (`woid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workopder` (
    `wopderid` INTEGER NOT NULL AUTO_INCREMENT,
    `wopderg1` INTEGER NOT NULL DEFAULT 0,
    `wopderg2` INTEGER NOT NULL DEFAULT 0,
    `wopderg3` INTEGER NOT NULL DEFAULT 0,
    `wopderg4` INTEGER NOT NULL DEFAULT 0,
    `wopderg5` INTEGER NOT NULL DEFAULT 0,
    `wopderg6` VARCHAR(255) NULL,
    `wardid` INTEGER NOT NULL,
    `catid` INTEGER NULL,
    `wopderdate` DATETIME(3) NULL,

    INDEX `workopder_wopderdate_idx`(`wopderdate`),
    INDEX `workopder_wardid_idx`(`wardid`),
    INDEX `workopder_catid_idx`(`catid`),
    PRIMARY KEY (`wopderid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `notid` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `senderId` INTEGER NULL,
    `receiverId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_receiverId_idx`(`receiverId`),
    INDEX `notification_isRead_idx`(`isRead`),
    PRIMARY KEY (`notid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_ticket` (
    `ticketId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `photoUpload` LONGTEXT NULL,
    `location` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `category` ENUM('SYSTEM', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `reporterId` INTEGER NOT NULL,
    `assigneeId` INTEGER NULL,

    INDEX `report_ticket_status_idx`(`status`),
    INDEX `report_ticket_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`ticketId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workadd` ADD CONSTRAINT `workadd_catid_fkey` FOREIGN KEY (`catid`) REFERENCES `workcat`(`catid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workadd` ADD CONSTRAINT `workadd_wardid_fkey` FOREIGN KEY (`wardid`) REFERENCES `warduser`(`wardid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workaddout` ADD CONSTRAINT `workaddout_wardid_fkey` FOREIGN KEY (`wardid`) REFERENCES `warduser`(`wardid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workopder` ADD CONSTRAINT `workopder_wardid_fkey` FOREIGN KEY (`wardid`) REFERENCES `warduser`(`wardid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workopder` ADD CONSTRAINT `workopder_catid_fkey` FOREIGN KEY (`catid`) REFERENCES `workcat`(`catid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `warduser`(`wardid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `warduser`(`wardid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_ticket` ADD CONSTRAINT `report_ticket_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `warduser`(`wardid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_ticket` ADD CONSTRAINT `report_ticket_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `warduser`(`wardid`) ON DELETE SET NULL ON UPDATE CASCADE;
