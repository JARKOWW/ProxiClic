CREATE TABLE `review_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`review_id` integer NOT NULL,
	`mime` text NOT NULL,
	`data` blob NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_photos_review_idx` ON `review_photos` (`review_id`);--> statement-breakpoint
ALTER TABLE `reviews` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `reply` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `replied_at` integer;