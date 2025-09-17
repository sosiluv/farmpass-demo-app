# 데이터베이스 스키마 & RLS 정책 (정확판)

## 📦 모델(테이블) 목록

`farm_members`, `farms`, `notifications`, `profiles`, `push_subscriptions`, `system_logs`, `system_settings`, `terms_management`, `user_consents`, `user_notification_settings`, `visitor_entries`

---

# 데이터베이스 스키마 (Prisma 원본 기준)

### `farm_members`

| Field              | Type       | Attributes                                                                            |
| ------------------ | ---------- | ------------------------------------------------------------------------------------- |
| `id`               | `String`   | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                               |
| `farm_id`          | `String`   | @db.Uuid                                                                              |
| `user_id`          | `String`   | @db.Uuid                                                                              |
| `role`             | `String`   | @default("viewer")                                                                    |
| `position`         | `String?`  | —                                                                                     |
| `responsibilities` | `String?`  | —                                                                                     |
| `is_active`        | `Boolean`  | @default(true)                                                                        |
| `created_at`       | `DateTime` | @default(now()) @db.Timestamptz(6)                                                    |
| `updated_at`       | `DateTime` | @default(now()) @db.Timestamptz(6)                                                    |
| `farms`            | `farms`    | @relation(fields: [farm_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |
| `profiles`         | `profiles` | @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |

**Indexes & Constraints**

- `@@unique([farm_id, user_id])`
- `@@index([farm_id], map: "idx_farm_members_farm_id")`
- `@@index([role], map: "idx_farm_members_role")`
- `@@index([user_id], map: "idx_farm_members_user_id")`

---

### `farms`

| Field                   | Type                | Attributes                                                                             |
| ----------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `id`                    | `String`            | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                                |
| `farm_name`             | `String`            | —                                                                                      |
| `description`           | `String?`           | —                                                                                      |
| `farm_address`          | `String`            | —                                                                                      |
| `farm_detailed_address` | `String?`           | —                                                                                      |
| `farm_type`             | `String?`           | —                                                                                      |
| `owner_id`              | `String`            | @db.Uuid                                                                               |
| `manager_phone`         | `String?`           | —                                                                                      |
| `manager_name`          | `String?`           | —                                                                                      |
| `is_active`             | `Boolean`           | @default(true)                                                                         |
| `created_at`            | `DateTime`          | @default(now()) @db.Timestamptz(6)                                                     |
| `updated_at`            | `DateTime`          | @default(now()) @db.Timestamptz(6)                                                     |
| `farm_members`          | `farm_members[]`    | —                                                                                      |
| `profiles`              | `profiles`          | @relation(fields: [owner_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |
| `visitor_entries`       | `visitor_entries[]` | —                                                                                      |

**Indexes & Constraints**

- `@@index([created_at], map: "idx_farms_created_at")`
- `@@index([is_active], map: "idx_farms_is_active")`
- `@@index([owner_id], map: "idx_farms_owner_id")`

---

### `notifications`

| Field        | Type       | Attributes                                                                            |
| ------------ | ---------- | ------------------------------------------------------------------------------------- |
| `id`         | `String`   | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                               |
| `user_id`    | `String`   | @db.Uuid                                                                              |
| `type`       | `String`   | —                                                                                     |
| `title`      | `String`   | —                                                                                     |
| `message`    | `String`   | —                                                                                     |
| `data`       | `Json?`    | —                                                                                     |
| `read`       | `Boolean`  | @default(false)                                                                       |
| `created_at` | `DateTime` | @default(now()) @db.Timestamptz(6)                                                    |
| `updated_at` | `DateTime` | @default(now()) @db.Timestamptz(6)                                                    |
| `link`       | `String?`  | —                                                                                     |
| `profiles`   | `profiles` | @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |

**Indexes & Constraints**

- `@@index([user_id], map: "idx_notifications_user_id")`

---

### `profiles`

| Field                        | Type                          | Attributes                         |
| ---------------------------- | ----------------------------- | ---------------------------------- |
| `id`                         | `String`                      | @id @db.Uuid                       |
| `email`                      | `String`                      | @unique                            |
| `name`                       | `String`                      | @default("")                       |
| `phone`                      | `String?`                     | —                                  |
| `account_type`               | `String`                      | @default("user")                   |
| `company_name`               | `String?`                     | —                                  |
| `company_address`            | `String?`                     | —                                  |
| `business_type`              | `String?`                     | —                                  |
| `company_description`        | `String?`                     | —                                  |
| `establishment_date`         | `DateTime?`                   | @db.Date                           |
| `employee_count`             | `Int?`                        | —                                  |
| `company_website`            | `String?`                     | —                                  |
| `position`                   | `String?`                     | —                                  |
| `department`                 | `String?`                     | —                                  |
| `bio`                        | `String?`                     | —                                  |
| `profile_image_url`          | `String?`                     | —                                  |
| `last_login_at`              | `DateTime?`                   | @db.Timestamptz(6)                 |
| `password_changed_at`        | `DateTime?`                   | @db.Timestamptz(6)                 |
| `login_count`                | `Int`                         | @default(0)                        |
| `is_active`                  | `Boolean`                     | @default(true)                     |
| `created_at`                 | `DateTime`                    | @default(now()) @db.Timestamptz(6) |
| `updated_at`                 | `DateTime`                    | @default(now()) @db.Timestamptz(6) |
| `login_attempts`             | `Int`                         | @default(0)                        |
| `last_login_attempt`         | `DateTime?`                   | @db.Timestamptz(6)                 |
| `last_failed_login`          | `DateTime?`                   | @db.Timestamptz(6)                 |
| `avatar_seed`                | `String?`                     | —                                  |
| `farm_members`               | `farm_members[]`              | —                                  |
| `farms`                      | `farms[]`                     | —                                  |
| `notifications`              | `notifications[]`             | —                                  |
| `push_subscriptions`         | `push_subscriptions[]`        | —                                  |
| `terms_management`           | `terms_management[]`          | —                                  |
| `user_consents`              | `user_consents[]`             | —                                  |
| `user_notification_settings` | `user_notification_settings?` | —                                  |
| `visitor_entries`            | `visitor_entries[]`           | —                                  |

**Indexes & Constraints**

- `@@index([account_type], map: "idx_profiles_account_type")`
- `@@index([created_at], map: "idx_profiles_created_at")`
- `@@index([email], map: "idx_profiles_email")`

---

### `push_subscriptions`

| Field          | Type        | Attributes                                                                            |
| -------------- | ----------- | ------------------------------------------------------------------------------------- |
| `id`           | `String`    | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                               |
| `user_id`      | `String`    | @db.Uuid                                                                              |
| `endpoint`     | `String`    | —                                                                                     |
| `p256dh`       | `String?`   | —                                                                                     |
| `auth`         | `String?`   | —                                                                                     |
| `created_at`   | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                    |
| `updated_at`   | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                    |
| `deleted_at`   | `DateTime`  | @db.Timestamptz(6)                                                                    |
| `device_id`    | `String?`   | —                                                                                     |
| `fail_count`   | `Int`       | @default(0)                                                                           |
| `is_active`    | `Boolean`   | @default(true)                                                                        |
| `last_fail_at` | `DateTime?` | @db.Timestamptz(6)                                                                    |
| `last_used_at` | `DateTime?` | @db.Timestamptz(6)                                                                    |
| `user_agent`   | `String?`   | —                                                                                     |
| `profiles`     | `profiles`  | @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |

**Indexes & Constraints**

- `@@unique([user_id, device_id])`
- `@@index([endpoint], map: "idx_push_subscriptions_endpoint")`
- `@@index([user_id], map: "idx_push_subscriptions_user_id")`
- `@@index([device_id], map: "idx_push_subscriptions_device_id")`

---

### `system_logs`

| Field           | Type       | Attributes                                              |
| --------------- | ---------- | ------------------------------------------------------- |
| `id`            | `String`   | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| `level`         | `LogLevel` | @default(info)                                          |
| `action`        | `String`   | —                                                       |
| `message`       | `String`   | —                                                       |
| `user_id`       | `String?`  | @db.Uuid                                                |
| `user_email`    | `String?`  | —                                                       |
| `user_ip`       | `String?`  | —                                                       |
| `user_agent`    | `String?`  | —                                                       |
| `resource_type` | `String?`  | —                                                       |
| `resource_id`   | `String?`  | @db.Uuid                                                |
| `metadata`      | `Json?`    | —                                                       |
| `created_at`    | `DateTime` | @default(now()) @db.Timestamptz(6)                      |

**Indexes & Constraints**

- `@@index([user_id])`
- `@@index([level])`
- `@@index([action])`
- `@@index([resource_type])`
- `@@index([created_at])`

---

### `system_settings`

| Field                            | Type        | Attributes                                                                                      |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `siteName`                       | `String`    | @default("농장 출입 관리 시스템(FarmPass)")                                                     |
| `siteDescription`                | `String`    | @default("방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.") |
| `language`                       | `String`    | @default("ko")                                                                                  |
| `timezone`                       | `String`    | @default("Asia/Seoul")                                                                          |
| `dateFormat`                     | `String`    | @default("YYYY-MM-DD")                                                                          |
| `favicon`                        | `String?`   | —                                                                                               |
| `logo`                           | `String?`   | —                                                                                               |
| `maxLoginAttempts`               | `Int`       | @default(5)                                                                                     |
| `passwordMinLength`              | `Int`       | @default(8)                                                                                     |
| `passwordRequireSpecialChar`     | `Boolean`   | @default(true)                                                                                  |
| `passwordRequireNumber`          | `Boolean`   | @default(true)                                                                                  |
| `reVisitAllowInterval`           | `Int`       | @default(6)                                                                                     |
| `maxVisitorsPerDay`              | `Int`       | @default(100)                                                                                   |
| `visitorDataRetentionDays`       | `Int`       | @default(1095)                                                                                  |
| `requireVisitorPhoto`            | `Boolean`   | @default(false)                                                                                 |
| `requireVisitorContact`          | `Boolean`   | @default(true)                                                                                  |
| `requireVisitPurpose`            | `Boolean`   | @default(true)                                                                                  |
| `visitTemplate`                  | `String`    | @default("{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.")                   |
| `logLevel`                       | `LogLevel`  | @default(info)                                                                                  |
| `logRetentionDays`               | `Int`       | @default(90)                                                                                    |
| `maintenanceMode`                | `Boolean`   | @default(false)                                                                                 |
| `debugMode`                      | `Boolean`   | @default(false)                                                                                 |
| `passwordRequireUpperCase`       | `Boolean`   | @default(true)                                                                                  |
| `passwordRequireLowerCase`       | `Boolean`   | @default(true)                                                                                  |
| `maintenanceContactInfo`         | `String`    | @default("문의사항이 있으시면 관리자에게 연락해 주세요.")                                       |
| `maintenanceEstimatedTime`       | `Int`       | @default(30)                                                                                    |
| `maintenanceMessage`             | `String`    | @default("현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.")                              |
| `maintenanceStartTime`           | `DateTime?` | —                                                                                               |
| `accountLockoutDurationMinutes`  | `Int`       | @default(15)                                                                                    |
| `notificationBadge`              | `String?`   | —                                                                                               |
| `notificationIcon`               | `String?`   | —                                                                                               |
| `pushRequireInteraction`         | `Boolean`   | @default(false)                                                                                 |
| `pushSoundEnabled`               | `Boolean`   | @default(false)                                                                                 |
| `pushVibrateEnabled`             | `Boolean`   | @default(false)                                                                                 |
| `vapidPrivateKey`                | `String?`   | —                                                                                               |
| `vapidPublicKey`                 | `String?`   | —                                                                                               |
| `created_at`                     | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                              |
| `updated_at`                     | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                              |
| `id`                             | `String`    | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                                         |
| `subscriptionCleanupDays`        | `Int`       | @default(30)                                                                                    |
| `subscriptionCleanupInactive`    | `Boolean`   | @default(true)                                                                                  |
| `subscriptionFailCountThreshold` | `Int`       | @default(5)                                                                                     |
| `subscriptionForceDelete`        | `Boolean`   | @default(false)                                                                                 |

---

### `terms_management`

| Field           | Type              | Attributes                                                                               |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `id`            | `String`          | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                                  |
| `type`          | `String`          | —                                                                                        |
| `title`         | `String`          | —                                                                                        |
| `content`       | `String`          | —                                                                                        |
| `version`       | `String`          | —                                                                                        |
| `is_active`     | `Boolean`         | @default(false)                                                                          |
| `is_draft`      | `Boolean`         | @default(true)                                                                           |
| `published_at`  | `DateTime?`       | @db.Timestamptz(6)                                                                       |
| `created_by`    | `String?`         | @db.Uuid                                                                                 |
| `created_at`    | `DateTime`        | @default(now()) @db.Timestamptz(6)                                                       |
| `updated_at`    | `DateTime`        | @default(now()) @db.Timestamptz(6)                                                       |
| `profiles`      | `profiles?`       | @relation(fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction) |
| `user_consents` | `user_consents[]` | —                                                                                        |

**Indexes & Constraints**

- `@@unique([type, version])`
- `@@index([type], map: "idx_terms_management_type")`
- `@@index([is_active], map: "idx_terms_management_is_active")`
- `@@index([created_by], map: "idx_terms_management_created_by")`

---

### `user_consents`

| Field              | Type               | Attributes                                                                             |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------- |
| `id`               | `String`           | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                                |
| `user_id`          | `String`           | @db.Uuid                                                                               |
| `agreed`           | `Boolean`          | @default(false)                                                                        |
| `agreed_at`        | `DateTime?`        | @db.Timestamptz(6)                                                                     |
| `created_at`       | `DateTime`         | @default(now()) @db.Timestamptz(6)                                                     |
| `updated_at`       | `DateTime`         | @default(now()) @db.Timestamptz(6)                                                     |
| `term_id`          | `String`           | @db.Uuid                                                                               |
| `terms_management` | `terms_management` | @relation(fields: [term_id], references: [id], onDelete: NoAction, onUpdate: NoAction) |
| `profiles`         | `profiles`         | @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)  |

**Indexes & Constraints**

- `@@unique([user_id, term_id])`
- `@@index([user_id], map: "idx_user_consents_user_id")`
- `@@index([term_id], map: "idx_user_consents_term_id")`

---

### `user_notification_settings`

| Field                 | Type       | Attributes                                                                            |
| --------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`                  | `String`   | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                               |
| `user_id`             | `String`   | @unique @db.Uuid                                                                      |
| `notification_method` | `String`   | @db.VarChar(20)                                                                       |
| `visitor_alerts`      | `Boolean`  | @default(true)                                                                        |
| `kakao_user_id`       | `String?`  | @db.VarChar(100)                                                                      |
| `is_active`           | `Boolean`  | @default(false)                                                                       |
| `created_at`          | `DateTime` | @default(now()) @db.Timestamptz(6)                                                    |
| `updated_at`          | `DateTime` | @default(now()) @updatedAt @db.Timestamptz(6)                                         |
| `system_alerts`       | `Boolean`  | @default(true)                                                                        |
| `profiles`            | `profiles` | @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |

---

### `visitor_entries`

| Field                | Type        | Attributes                                                                            |
| -------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `id`                 | `String`    | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid                               |
| `farm_id`            | `String`    | @db.Uuid                                                                              |
| `visit_datetime`     | `DateTime`  | @db.Timestamptz(6)                                                                    |
| `visitor_name`       | `String`    | —                                                                                     |
| `visitor_phone`      | `String`    | —                                                                                     |
| `visitor_address`    | `String`    | —                                                                                     |
| `visitor_purpose`    | `String?`   | —                                                                                     |
| `disinfection_check` | `Boolean`   | @default(false)                                                                       |
| `vehicle_number`     | `String?`   | —                                                                                     |
| `notes`              | `String?`   | —                                                                                     |
| `registered_by`      | `String?`   | @db.Uuid                                                                              |
| `session_token`      | `String`    | @default(dbgenerated("(gen_random_uuid())::text"))                                    |
| `consent_given`      | `Boolean`   | @default(false)                                                                       |
| `created_at`         | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                    |
| `updated_at`         | `DateTime`  | @default(now()) @db.Timestamptz(6)                                                    |
| `profile_photo_url`  | `String?`   | —                                                                                     |
| `farms`              | `farms`     | @relation(fields: [farm_id], references: [id], onDelete: Cascade, onUpdate: NoAction) |
| `profiles`           | `profiles?` | @relation(fields: [registered_by], references: [id], onUpdate: NoAction)              |

**Indexes & Constraints**

- `@@index([created_at], map: "idx_visitor_entries_created_at")`
- `@@index([farm_id], map: "idx_visitor_entries_farm_id")`
- `@@index([visit_datetime], map: "idx_visitor_entries_visit_datetime")`
- `@@index([visitor_phone], map: "idx_visitor_entries_visitor_phone")`

## Enums

- `LogLevel`: error, warn, info, debug

## RLS 개요 (SQL 정책 요약)

- RLS 활성 테이블: `profiles`, `farms`, `farm_members`, `visitor_entries`, `system_settings`, `system_logs`, `push_subscriptions`, `user_notification_settings`, `notifications`, `terms_management`, `user_consents`.
- 관리자 판별 함수: `public.is_system_admin()` (SECURITY DEFINER) — 관리자일 때 RLS 우회.
- 농장 접근 함수: `public.can_access_farm(row)` — row 단위 접근 가능 여부 평가.
- 예시 정책:
  - profiles: "Users can view/update own profile", "Admins can manage all profiles".
  - notifications: "Users can view own notifications", "Admins can manage all notifications".
  - user_consents: "Users can manage own consents", "Admins can manage all consents".

> 전체 SQL 전문은 [scripts/project-policy.sql](../scripts/project-policy.sql) 파일을 참고하세요.

## Storage 버킷 & 보안 정책

## `profiles` (private)

- **INSERT**: 경로가 `"<userId>/..."` 인 경우 본인만 허용. `systems/` 폴더는 **관리자만**
- **SELECT**: 본인 또는 관리자, 또는 **같은 농장의 구성원**이면 허용
- **UPDATE/DELETE**: 본인 또는 관리자(관리자 `systems/` 업로드/수정/삭제 가능)
- **제약**: `size ≤ 5MB`, `mimetype ∈ { image/jpeg, image/png, image/webp, image/svg+xml, image/x-icon }`

## `visitor-photos` (public)

- **INSERT/SELECT/UPDATE/DELETE**: `bucket_id = 'visitor-photos'` 인 모든 사용(공개) 허용 — 운영 정책에 따라 조정 가능

> 전체 SQL 전문은 [scripts/image-upload-policy.sql](../scripts/image-upload-policy.sql) 파일을 참고하세요.

---
