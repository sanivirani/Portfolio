CREATE TABLE `ownerVerificationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ownerVerificationSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ownerVerificationSessions_userId_unique` UNIQUE(`userId`)
);
