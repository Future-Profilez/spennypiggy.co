/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `g2fa_secret` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `app_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0 - Error, 1 - running, 2 - Force Stopped',
  `last_error` longtext DEFAULT NULL,
  `last_error_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_redirects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_redirects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `country` varchar(30) DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `target` varchar(255) DEFAULT NULL,
  `query_string` varchar(255) DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `auth_redirects_uuid_index` (`uuid`),
  KEY `auth_redirects_uuid_target_index` (`uuid`,`target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bills` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `product_id` varchar(255) DEFAULT NULL,
  `price_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `supporter_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of supporters for this bill',
  `gift_frequency` enum('daily','weekly','monthly','rarely') NOT NULL DEFAULT 'rarely' COMMENT 'How often contributions are received',
  `creator_growth_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Creator growth percentage',
  `rising_score` int(11) NOT NULL DEFAULT 0 COMMENT 'Rising popularity score (0-100)',
  `engagement_level` enum('low','medium','high','viral') NOT NULL DEFAULT 'low' COMMENT 'Engagement level category',
  `trending_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this bill is currently trending',
  PRIMARY KEY (`id`),
  KEY `bills_user_id_index` (`user_id`),
  KEY `bills_approved_index` (`approved`),
  KEY `bills_deleted_at_index` (`deleted_at`),
  KEY `bills_supporter_count_index` (`supporter_count`),
  KEY `bills_rising_score_index` (`rising_score`),
  KEY `bills_trending_status_index` (`trending_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `connected_account_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `connected_account_customers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `creator_id` bigint(20) unsigned NOT NULL,
  `connected_account_id` varchar(255) NOT NULL,
  `stripe_customer_id` varchar(255) NOT NULL,
  `product_type` varchar(255) DEFAULT NULL,
  `product_id` varchar(255) DEFAULT NULL,
  `price_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `connected_account_customers_user_id_foreign` (`user_id`),
  KEY `connected_account_customers_creator_id_foreign` (`creator_id`),
  CONSTRAINT `connected_account_customers_creator_id_foreign` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `connected_account_customers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `creator_shipping_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `creator_shipping_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `creator_id` bigint(20) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address_1` text DEFAULT NULL,
  `address_2` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `province_code` varchar(255) DEFAULT NULL,
  `country_code` varchar(255) DEFAULT NULL,
  `postal_code` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `creator_shipping_addresses_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currencies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ISO` varchar(10) NOT NULL COMMENT 'ISO Code',
  `conversion_rate` double(10,4) DEFAULT NULL COMMENT 'Base is GBP',
  `name` varchar(100) NOT NULL,
  `demonym` varchar(100) DEFAULT NULL,
  `majorSingle` varchar(100) DEFAULT NULL,
  `majorPlural` varchar(100) DEFAULT NULL,
  `ISOnum` int(11) DEFAULT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `symbolNative` varchar(10) DEFAULT NULL,
  `minorSingle` varchar(100) DEFAULT NULL,
  `minorPlural` varchar(100) DEFAULT NULL,
  `ISOdigits` int(11) DEFAULT 2,
  `numToBasic` int(11) DEFAULT 100,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gifter_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gifter_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'this is the user id of gifter',
  `country` text DEFAULT NULL,
  `street_address` text DEFAULT NULL,
  `city` text DEFAULT NULL,
  `state` text DEFAULT NULL,
  `postal_code` text DEFAULT NULL,
  `stripe_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'this address is get from stripe when gifter pay from card' CHECK (json_valid(`stripe_address`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gifter_card_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gifter_card_verifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `amount` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `payment_details` longtext DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gifter_card_verifications_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `memberships` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `supporter_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of supporters for this membership tier',
  `gift_frequency` enum('daily','weekly','monthly','rarely') NOT NULL DEFAULT 'rarely' COMMENT 'How often memberships are gifted',
  `creator_growth_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Creator growth percentage',
  `rising_score` int(11) NOT NULL DEFAULT 0 COMMENT 'Rising popularity score (0-100)',
  `engagement_level` enum('low','medium','high','viral') NOT NULL DEFAULT 'low' COMMENT 'Engagement level category',
  `trending_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this membership is currently trending',
  PRIMARY KEY (`id`),
  KEY `memberships_user_id_index` (`user_id`),
  KEY `memberships_approved_index` (`approved`),
  KEY `memberships_deleted_at_index` (`deleted_at`),
  KEY `memberships_supporter_count_index` (`supporter_count`),
  KEY `memberships_rising_score_index` (`rising_score`),
  KEY `memberships_trending_status_index` (`trending_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notification` longtext NOT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT 0,
  `target_id` bigint(20) unsigned DEFAULT NULL,
  `module` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `posts_user_id_index` (`user_id`),
  KEY `posts_approved_index` (`approved`),
  KEY `posts_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_order_details` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `creater_id` bigint(20) unsigned DEFAULT NULL,
  `cart_id` varchar(255) DEFAULT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `session_id` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_order_details_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `promo_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promo_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `limit` bigint(20) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `push_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `push_notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `endpoint` text DEFAULT NULL,
  `auth_token` text DEFAULT NULL,
  `p256dh_key` text DEFAULT NULL,
  `content_encoding` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `referals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `promocode_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rye_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rye_carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `creator_id` bigint(20) NOT NULL,
  `cart_id` varchar(255) NOT NULL,
  `cart_details` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rye_product_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rye_product_payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `amount` decimal(10,2) unsigned NOT NULL,
  `tax` decimal(10,2) unsigned NOT NULL DEFAULT 0.00,
  `message` text DEFAULT NULL,
  `anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','succeeded','failed','refunded','canceled') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(255) DEFAULT NULL,
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shipping_address`)),
  `customer_email` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_charge_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_client_secret` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_status` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_last_payment_error` varchar(255) DEFAULT NULL,
  `payment_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rye_product_payments_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rye_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rye_products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `stripe_product_id` varchar(255) DEFAULT NULL,
  `creator_id` bigint(20) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `details` longtext NOT NULL COMMENT 'all the product details in json',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shops` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `supporter_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of supporters for this shop item',
  `gift_frequency` enum('daily','weekly','monthly','rarely') NOT NULL DEFAULT 'rarely' COMMENT 'How often this item is purchased as gifts',
  `creator_growth_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Creator growth percentage',
  `rising_score` int(11) NOT NULL DEFAULT 0 COMMENT 'Rising popularity score (0-100)',
  `engagement_level` enum('low','medium','high','viral') NOT NULL DEFAULT 'low' COMMENT 'Engagement level category',
  `trending_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this shop item is currently trending',
  PRIMARY KEY (`id`),
  KEY `shops_user_id_index` (`user_id`),
  KEY `shops_approved_index` (`approved`),
  KEY `shops_deleted_at_index` (`deleted_at`),
  KEY `shops_supporter_count_index` (`supporter_count`),
  KEY `shops_rising_score_index` (`rising_score`),
  KEY `shops_trending_status_index` (`trending_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `social_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `social_links` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `whoyouinto` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `reddit` varchar(255) DEFAULT NULL,
  `discord` varchar(255) DEFAULT NULL,
  `onlyfans` varchar(255) DEFAULT NULL,
  `loyalfans` varchar(255) DEFAULT NULL,
  `fansly` varchar(255) DEFAULT NULL,
  `manyvids` varchar(255) DEFAULT NULL,
  `other` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stripe_payment_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stripe_payment_details` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `amount_subtotal` double DEFAULT 0,
  `amount_total` double DEFAULT 0,
  `tax` double NOT NULL DEFAULT 0,
  `currency` varchar(255) DEFAULT NULL,
  `payment_method_config_detail_id` varchar(255) DEFAULT NULL,
  `payment_method_type` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `owner_id` bigint(20) unsigned DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `session_created` varchar(255) DEFAULT NULL,
  `session_expires_at` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stripe_payment_details_user_id_index` (`user_id`),
  KEY `stripe_payment_details_owner_id_index` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stripe_payment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stripe_payment_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `stripe_payment_detail_id` bigint(20) unsigned DEFAULT NULL,
  `wish_item_id` bigint(20) unsigned DEFAULT NULL,
  `user_cart_id` bigint(20) unsigned DEFAULT NULL,
  `amount` double DEFAULT 0,
  `tax` double NOT NULL DEFAULT 0,
  `message` text DEFAULT NULL,
  `thankyou_message` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `message_media` varchar(255) DEFAULT NULL,
  `media_type` varchar(255) DEFAULT NULL,
  `is_read_user` int(11) NOT NULL DEFAULT 1,
  `is_read_owner` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stripe_payment_items_stripe_payment_detail_id_index` (`stripe_payment_detail_id`),
  KEY `stripe_payment_items_user_cart_id_index` (`user_cart_id`),
  KEY `stripe_payment_items_wish_item_id_index` (`wish_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stripe_webhook_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stripe_webhook_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint(20) unsigned DEFAULT NULL,
  `invoice_type` varchar(255) DEFAULT NULL,
  `data` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `owner_id` bigint(20) unsigned NOT NULL,
  `wish_id` bigint(20) unsigned NOT NULL,
  `start_at` timestamp NULL DEFAULT NULL,
  `end_at` timestamp NULL DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0-cancelled, 1-active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tip_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tip_goals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_id` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `price_id` varchar(255) DEFAULT NULL,
  `target` double(8,2) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `default_price` double(8,2) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `tax_amount` double(8,2) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `currency` varchar(255) DEFAULT 'GBP' COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0 => Until Acheived, 1 => Days set, 2 => Manually',
  `days` smallint(6) DEFAULT NULL,
  `completed` tinyint(4) NOT NULL DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `fullfilled` double(8,2) DEFAULT 0.00 COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `supporter_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of supporters for this tip goal',
  `gift_frequency` enum('daily','weekly','monthly','rarely') NOT NULL DEFAULT 'rarely' COMMENT 'How often tips are received',
  `creator_growth_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Creator growth percentage',
  `rising_score` int(11) NOT NULL DEFAULT 0 COMMENT 'Rising popularity score (0-100)',
  `engagement_level` enum('low','medium','high','viral') NOT NULL DEFAULT 'low' COMMENT 'Engagement level category',
  `trending_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this tip goal is currently trending',
  PRIMARY KEY (`id`),
  KEY `tip_goals_supporter_count_index` (`supporter_count`),
  KEY `tip_goals_rising_score_index` (`rising_score`),
  KEY `tip_goals_trending_status_index` (`trending_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tip_goals_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tip_goals_payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `product_id` varchar(255) DEFAULT NULL,
  `tip_goal_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `guest_name` varchar(255) DEFAULT NULL,
  `guest_email` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `amount` double(10,2) NOT NULL DEFAULT 0.00,
  `tax` double(10,2) NOT NULL DEFAULT 0.00,
  `message` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'initiated',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `quantity` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `tip_goals_payments_tip_goal_id_index` (`tip_goal_id`),
  KEY `tip_goals_payments_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `twitter_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `twitter_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `twitter_id` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `device_id` text DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `owner_id` bigint(20) unsigned DEFAULT NULL,
  `wish_item_id` bigint(20) unsigned DEFAULT NULL,
  `status` tinyint(4) NOT NULL,
  `amount` double NOT NULL DEFAULT 0,
  `tax` double NOT NULL DEFAULT 0,
  `country` varchar(255) DEFAULT NULL COMMENT 'user add cart from which domain uk or global',
  `priceid` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_subscribed` tinyint(4) NOT NULL DEFAULT 0,
  `quantity` bigint(20) unsigned DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_carts_user_id_index` (`user_id`),
  KEY `user_carts_owner_id_index` (`owner_id`),
  KEY `user_carts_wish_item_id_index` (`wish_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `category` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_categories_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_intros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_intros` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `content` text NOT NULL,
  `video` varchar(255) DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_intros_user_id_index` (`user_id`),
  KEY `user_intros_approved_index` (`approved`),
  KEY `user_intros_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint(20) unsigned NOT NULL,
  `to_user_id` bigint(20) unsigned NOT NULL,
  `product_type` varchar(255) DEFAULT NULL,
  `amount` bigint(20) unsigned NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_details` longtext DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_payments_from_user_id_foreign` (`from_user_id`),
  KEY `user_payments_to_user_id_foreign` (`to_user_id`),
  CONSTRAINT `user_payments_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_payments_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_verification_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_verification_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `role` tinyint(4) DEFAULT NULL COMMENT '0: gifter, 1: creator',
  `bio_status` tinyint(4) DEFAULT NULL COMMENT '0: not approved, 1: approved',
  `social_status` tinyint(4) DEFAULT NULL COMMENT '0: not approved, 1: approved',
  `address_status` tinyint(4) DEFAULT NULL COMMENT '0: pending, 1: approved, 2: rejected',
  `address_verification_error` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_verification_status_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) DEFAULT NULL,
  `stripe_id` varchar(255) DEFAULT NULL,
  `identity_verification_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`identity_verification_details`)),
  `identity_verification_error` text DEFAULT NULL,
  `identity_verified_at` timestamp NULL DEFAULT NULL,
  `identity_status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1 = user identity verified, 0 = user identity not verified',
  `stripe_user_id` varchar(255) DEFAULT NULL,
  `account_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `stripe_details_submitted` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `cover` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `default_currency` varchar(10) DEFAULT 'GBP' COMMENT 'Stripe Default Currency',
  `bio` varchar(255) DEFAULT NULL,
  `bio_approved` smallint(6) NOT NULL DEFAULT 0,
  `tags` longtext DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `twitter_id` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `auto_tweet` tinyint(4) NOT NULL DEFAULT 0,
  `charges_enabled` tinyint(4) NOT NULL DEFAULT 0,
  `kyc_error` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`kyc_error`)),
  `is_uk` tinyint(4) NOT NULL DEFAULT 0,
  `profile_status_lock` smallint(6) NOT NULL DEFAULT 0 COMMENT '0: locked, 1: pending, 2: unlocked',
  `edit_bio_reason` longtext DEFAULT NULL,
  `suspended_account` int(11) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expired_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_500_limit_exceeded` smallint(6) NOT NULL DEFAULT 0 COMMENT 'this is for the gifter',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_id_index` (`id`),
  KEY `users_username_index` (`username`),
  KEY `users_email_index` (`email`),
  KEY `users_email_password_index` (`email`,`password`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wish_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wish_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `wish_item_id` bigint(20) unsigned DEFAULT NULL,
  `user_category_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wish_categories_wish_item_id_user_category_id_index` (`wish_item_id`,`user_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wish_item_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wish_item_subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `stripe_id` varchar(255) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Stripe Session Id',
  `wish_item_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `guest_name` varchar(100) DEFAULT NULL,
  `guest_email` varchar(150) DEFAULT NULL,
  `currency` varchar(255) DEFAULT 'GBP',
  `amount` double(8,2) NOT NULL,
  `tax` double(8,2) NOT NULL,
  `recurring_for` varchar(255) DEFAULT NULL COMMENT 'onetime,continue',
  `recurring_type` varchar(255) DEFAULT NULL COMMENT 'daily,weekly,monthly,yearly',
  `surprise_message` longtext DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  `upcoming_payment` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT 'initiated' COMMENT 'Stripe Subscription Message',
  `twitter_response` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wish_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wish_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stripe_product_id` varchar(255) DEFAULT NULL,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `wishname` varchar(255) NOT NULL,
  `price` double(10,2) DEFAULT 0.00 COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `price_id` varchar(255) DEFAULT NULL,
  `item_url` text DEFAULT NULL,
  `thumbnail` text DEFAULT NULL,
  `subscription` tinyint(4) NOT NULL COMMENT '0-single, 1-subs, 2-crowdfund',
  `subscription_period` varchar(255) DEFAULT NULL,
  `repeat_purchase` tinyint(4) NOT NULL DEFAULT 0,
  `category` text DEFAULT NULL,
  `sort` smallint(6) NOT NULL DEFAULT 0,
  `is_pin` tinyint(4) NOT NULL DEFAULT 0,
  `fullfill_amount` double(8,2) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `tax_amount` double(8,2) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `twitter_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`twitter_response`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `delete_reason` varchar(255) DEFAULT NULL,
  `edited_reason` longtext DEFAULT NULL,
  `edited_status` int(11) DEFAULT NULL COMMENT '0 = edited request is in pending, 1 = edited , null = not get any request ',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL COMMENT 'DEPRECATED: Use supporter_count and social metrics instead',
  `is_approved` int(11) NOT NULL DEFAULT 0,
  `supporter_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of supporters for this wish item',
  `gift_frequency` enum('daily','weekly','monthly','rarely') NOT NULL DEFAULT 'rarely' COMMENT 'How often gifts are received',
  `creator_growth_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Creator growth percentage',
  `rising_score` int(11) NOT NULL DEFAULT 0 COMMENT 'Rising popularity score (0-100)',
  `engagement_level` enum('low','medium','high','viral') NOT NULL DEFAULT 'low' COMMENT 'Engagement level category',
  `trending_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this item is currently trending',
  PRIMARY KEY (`id`),
  KEY `wish_items_user_id_index` (`user_id`),
  KEY `wish_items_supporter_count_index` (`supporter_count`),
  KEY `wish_items_rising_score_index` (`rising_score`),
  KEY `wish_items_trending_status_index` (`trending_status`),
  KEY `wish_items_engagement_level_trending_status_index` (`engagement_level`,`trending_status`),
  FULLTEXT KEY `wish_items_wishname_fulltext` (`wishname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'2014_10_12_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'2014_10_12_100000_create_password_reset_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'2019_08_19_000000_create_failed_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2019_12_14_000001_create_personal_access_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2022_10_30_151028_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2023_11_01_064439_add_uuid_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2023_11_01_142010_create_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2023_11_01_165517_add_stripe_id_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2023_11_02_144558_add_account_id_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'2023_11_03_005316_add_stripe_details_submitted_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2023_11_03_045409_add_stripe_product_id_in_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2023_11_03_075347_create_user_categories_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2023_11_03_113349_create_wish_categories_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2023_11_06_072124_create_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2023_11_07_054525_create_social_links_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2023_11_07_122828_add_price_id_in_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2023_11_08_053824_create_app_services_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2023_11_10_063132_create_stripe_payment_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2023_11_10_073635_add_charges_enabled_in_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2023_11_16_032057_create_admins_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2023_11_17_055616_add_columns_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2023_11_17_055801_add_columns_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2023_11_17_065105_create_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2023_11_17_065327_create_subscriptions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2023_11_18_042716_add_tax_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2023_11_18_074439_add_tax_to_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2023_11_18_074924_add_tax_to_stripe_payment_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28,'2023_11_21_043757_add_country_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2023_11_21_171118_change_stripe_details_submitted_type_in_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2023_11_23_052430_add_columns_to_stripe_payment_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2023_11_23_073243_add_message_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2023_11_24_044825_change_wish_id_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2023_11_24_110259_change_user_id_attributes_to_user_carts',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2023_11_29_060525_add_quantity_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2023_11_29_091221_alter_table_user_carts_change_columns',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2023_11_29_105713_add_device_id_in_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2023_12_01_060027_add_expired_at_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38,'2023_12_05_062533_add_soft_delete_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (39,'2023_12_05_064722_add_soft_delete_social_links',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (40,'2023_12_05_064911_add_soft_delete_subscriptions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (41,'2023_12_05_065852_add_soft_delete_user_carts',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (42,'2023_12_05_070208_add_soft_delete_user_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (43,'2023_12_05_070415_add_soft_delete_wish_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (44,'2023_12_05_092244_add_soft_delete_stripe_payment_items',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (45,'2023_12_05_092258_add_soft_delete_stripe_payment_details',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (46,'2023_12_05_092729_add_message_to_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (47,'2023_12_05_112831_add_is_subscribed_in_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (48,'2023_12_06_104658_add_quantity_to_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (49,'2023_12_07_123117_add_media_type_in_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (50,'2023_12_08_070020_change_default_value_for_is_read_user_in_stripe_payment_items',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (51,'2023_12_09_150353_add_default_currency_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (52,'2023_12_09_151128_add_currency_in_wish_items',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (53,'2023_12_11_011224_create_wish_item_subscriptions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (54,'2023_12_11_161611_add_surprise_message_to_wish_item_subscriptions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (55,'2023_12_11_164009_add_status_to_wish_item_subscriptions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (56,'2023_12_11_170027_add_session_id_to_wish_item_subscriptions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (57,'2023_12_12_091711_add_is_pin_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (58,'2023_12_12_114749_create_stripe_webhook_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (59,'2023_12_12_125545_drop_stripe_webhook_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (60,'2023_12_12_130339_create_stripe_webhook_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (61,'2023_12_12_161444_create_currencies_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (62,'2023_12_14_053138_add_invoice_type_to_stripe_webhook_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (63,'2023_12_14_130418_add_twitter_id_in_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (64,'2023_12_15_064623_create_twitter_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (65,'2023_12_15_073155_add_delete_reason_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (66,'2023_12_18_110310_create_tip_goals_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (67,'2023_12_19_050902_add_thankyou_message_to_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (68,'2023_12_19_093016_change_tax_amount_in_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (69,'2023_12_19_093234_change_amount_in_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (70,'2023_12_19_093453_change_amount_in_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (71,'2023_12_19_093530_change_amount_in_stripe_payment_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (72,'2023_12_19_124427_add_auto_tweet_in_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (73,'2023_12_20_015509_add_indexes_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (74,'2023_12_20_023057_add_indexs_in_wish_items',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (75,'2023_12_20_023758_add_indexs_in_wish_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (76,'2023_12_20_023939_add_indexs_in_user_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (77,'2023_12_20_025306_cahnge_columns_in_wish_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (78,'2023_12_20_025801_add_indexs_in_wish_categories',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (79,'2023_12_20_071254_change_wish_id_in_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (80,'2023_12_20_072326_change_indexes_in_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (81,'2023_12_20_075453_change_indexes_in_stripe_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (82,'2023_12_20_090122_change_indexes_in_stripe_payment_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (83,'2023_12_20_114056_create_tip_goals_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (84,'2023_12_22_045759_add_suspended_account_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (85,'2023_12_22_052801_add_columns_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (86,'2023_12_22_101406_change_user_id_in_tip_goals_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (87,'2023_12_25_103639_add_sort_in_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (88,'2023_12_26_114451_change_product_id_in_tip_goals_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (89,'2023_12_27_062011_changes_in_tip_goals_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (90,'2023_12_29_054420_create_promo_codes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (91,'2023_12_31_054549_add_twitter_response_in_wish_items',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (92,'2024_01_01_000000_create_bills_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (93,'2024_01_01_084953_create_auth_redirects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (94,'2024_01_01_104612_add_twitter_response_to_wish_item_subscriptions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (95,'2024_01_02_000000_create_memberships_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (96,'2024_01_03_000000_create_shops_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (97,'2024_01_04_000000_create_user_intros_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (98,'2024_01_04_065516_create_referals_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (99,'2024_01_05_000000_create_posts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (100,'2024_01_08_050517_add_is_approved_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (101,'2024_04_12_093243_add_edit_bio_reason_in_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (102,'2024_05_02_114826_create_notifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (103,'2024_05_03_072430_add_target_id_in_notifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (104,'2024_10_08_085857_add_is_uk_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (105,'2024_10_16_143335_add_kyc_error_in_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (106,'2024_10_21_111457_create_push_notifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (107,'2024_12_13_075158_add_country_to_user_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (108,'2024_12_21_092526_add_identity_status_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (109,'2025_01_08_100000_add_performance_indexes_for_pending_profiles',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (110,'2025_01_21_120000_add_social_engagement_fields_to_wish_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (111,'2025_01_21_120100_add_social_engagement_fields_to_bills_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (112,'2025_01_21_120200_add_social_engagement_fields_to_tip_goals_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (113,'2025_01_21_120300_add_social_engagement_fields_to_shops_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (114,'2025_01_21_120400_add_social_engagement_fields_to_memberships_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (115,'2025_01_21_120500_deprecate_monetary_fields_across_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (116,'2025_02_17_063822_create_rye_products_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (117,'2025_02_18_051941_create_rye_carts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (118,'2025_02_26_075944_create_product_order_details_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (119,'2025_02_26_092517_create_creator_shipping_addresses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (120,'2025_02_27_045901_create_rye_product_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (121,'2025_02_27_060213_add_stripe_product_id_to_rye_products_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (122,'2025_04_02_092846_add_shipping_address_to_rye_product_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (123,'2025_04_07_064514_add_ip_address_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (124,'2025_04_10_055024_change_address_type_to_creator_shipping_addresses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (125,'2025_04_15_120900_create_gifter_addresses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (126,'2025_04_16_054942_create_gifter_card_verifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (127,'2025_04_17_051618_add_profile_status_lock_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (128,'2025_04_21_091503_update_profile_status_lock_comment_on_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (129,'2025_04_21_125258_create_user_verification_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (130,'2025_04_21_130232_drop_address_verification_error_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (131,'2025_04_22_071226_add_country_column_to_gifter_addresses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (132,'2025_05_23_053116_create_connected_account_customers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (133,'2025_05_29_060638_create_user_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (134,'2025_05_30_091042_change_user_profile_status_column_to_user_verification_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (135,'2025_05_30_123321_add_bio_approved_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (136,'2025_06_13_045928_add_currencies_to_connected_account_customers_table',1);
