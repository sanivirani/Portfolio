CREATE TABLE `caseStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(160) NOT NULL,
	`label` varchar(255) NOT NULL,
	`industry` varchar(160) NOT NULL,
	`role` text,
	`description` text NOT NULL,
	`focus` varchar(255) NOT NULL,
	`tone` enum('violet','lime','sand') NOT NULL DEFAULT 'violet',
	`services` text NOT NULL,
	`technologies` text NOT NULL,
	`metrics` text NOT NULL,
	`mediaId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseStudies_id` PRIMARY KEY(`id`),
	CONSTRAINT `caseStudies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `portfolioMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`key` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`altText` varchar(255) NOT NULL DEFAULT '',
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioMedia_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolioMedia_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSettings` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioSettings_key` PRIMARY KEY(`key`)
);
