CREATE DATABASE /*!32312 IF NOT EXISTS*/ `minutizer` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `minutizer`;

CREATE TABLE `User` (
  `email` varchar(255) NOT NULL,
  `userType` varchar(20) NOT NULL DEFAULT 'regular',
  `voiceRegistered` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `VoiceEnrollment` (
  `userEmail` varchar(255) NOT NULL,
  `enrollmentCount` int(11) DEFAULT NULL,
  `voiceEnrollmentStatus` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`userEmail`),
  CONSTRAINT `VoiceEnrollment_ibfk_1` FOREIGN KEY (`userEmail`) REFERENCES `User` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `Meeting` (
  `meetingId` int(11) NOT NULL AUTO_INCREMENT,
  `meetingName` varchar(255) DEFAULT NULL,
  `organizerEmail` varchar(255) DEFAULT NULL,
  `startTime` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `meetingDate` date DEFAULT NULL,
  PRIMARY KEY (`meetingId`),
  KEY `organizerEmail` (`organizerEmail`),
  CONSTRAINT `Meeting_ibfk_1` FOREIGN KEY (`organizerEmail`) REFERENCES `User` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `Attendance` (
  `meetingId` int(11) NOT NULL,
  `userEmail` varchar(255) NOT NULL,
  PRIMARY KEY (`meetingId`,`userEmail`),
  KEY `userEmail` (`userEmail`),
  CONSTRAINT `Attendance_ibfk_1` FOREIGN KEY (`meetingId`) REFERENCES `Meeting` (`meetingId`),
  CONSTRAINT `Attendance_ibfk_2` FOREIGN KEY (`userEmail`) REFERENCES `User` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `TranscriptionRequest` (
  `requestId` varchar(255) NOT NULL,
  `meetingId` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processingCompleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`requestId`,`meetingId`),
  KEY `meetingId` (`meetingId`),
  CONSTRAINT `TranscriptionRequest_ibfk_1` FOREIGN KEY (`meetingId`) REFERENCES `Meeting` (`meetingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



