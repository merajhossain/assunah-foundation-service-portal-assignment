-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `roles` (`name`, `updated_at`) VALUES
    ('admin', CURRENT_TIMESTAMP(3)),
    ('office', CURRENT_TIMESTAMP(3)),
    ('requester', CURRENT_TIMESTAMP(3));

ALTER TABLE `users` ADD COLUMN `role_id` INTEGER NULL;

UPDATE `users` AS `u`
INNER JOIN `roles` AS `r` ON `r`.`name` = `u`.`role`
SET `u`.`role_id` = `r`.`id`;

ALTER TABLE `users` DROP COLUMN `role`,
    MODIFY `role_id` INTEGER NOT NULL;

ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
