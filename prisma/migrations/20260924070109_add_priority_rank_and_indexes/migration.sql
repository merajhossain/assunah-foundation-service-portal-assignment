-- AlterTable
ALTER TABLE `service_requests` ADD COLUMN `priority_rank` TINYINT NOT NULL DEFAULT 2;

-- Backfill
UPDATE `service_requests`
SET `priority_rank` = CASE `priority`
    WHEN 'urgent' THEN 0
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
    ELSE 2
END;

-- CreateIndex
CREATE INDEX `service_activities_request_id_created_at_idx` ON `service_activities`(`request_id`, `created_at`);

-- CreateIndex
CREATE INDEX `service_activities_actor_id_request_id_idx` ON `service_activities`(`actor_id`, `request_id`);

-- CreateIndex
CREATE INDEX `service_requests_requester_id_updated_at_idx` ON `service_requests`(`requester_id`, `updated_at`);

-- CreateIndex
CREATE INDEX `service_requests_assignee_id_updated_at_idx` ON `service_requests`(`assignee_id`, `updated_at`);

-- CreateIndex
CREATE INDEX `service_requests_status_updated_at_idx` ON `service_requests`(`status`, `updated_at`);

-- CreateIndex
CREATE INDEX `service_requests_category_idx` ON `service_requests`(`category`);

-- CreateIndex
CREATE INDEX `service_requests_priority_rank_updated_at_idx` ON `service_requests`(`priority_rank`, `updated_at`);

-- CreateIndex
CREATE INDEX `service_requests_updated_at_idx` ON `service_requests`(`updated_at`);
