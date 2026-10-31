BEGIN;

UPDATE "User"
SET "role" = 'TEACHER'
WHERE "role"::text = 'ADMIN';

INSERT INTO tenant_roles (id, tenant_id, role_key, display_name, is_system_role)
SELECT gen_random_uuid(), admin_role.tenant_id, 'TEACHER', 'Teacher', true
FROM tenant_roles AS admin_role
WHERE admin_role.role_key = 'ADMIN'
ON CONFLICT (tenant_id, role_key) DO NOTHING;

INSERT INTO role_permissions (tenant_id, role_id, permission_id, created_at)
SELECT legacy.tenant_id, teacher.id, permission.permission_id, permission.created_at
FROM tenant_roles AS legacy
JOIN tenant_roles AS teacher
  ON teacher.tenant_id = legacy.tenant_id
 AND teacher.role_key = 'TEACHER'
JOIN role_permissions AS permission
  ON permission.tenant_id = legacy.tenant_id
 AND permission.role_id = legacy.id
WHERE legacy.role_key = 'ADMIN'
ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;

INSERT INTO user_roles (
    tenant_id,
    membership_id,
    role_id,
    granted_by_membership_id,
    granted_at,
    revoked_at
)
SELECT
    legacy_assignment.tenant_id,
    legacy_assignment.membership_id,
    teacher.id,
    legacy_assignment.granted_by_membership_id,
    legacy_assignment.granted_at,
    legacy_assignment.revoked_at
FROM user_roles AS legacy_assignment
JOIN tenant_roles AS legacy
  ON legacy.tenant_id = legacy_assignment.tenant_id
 AND legacy.id = legacy_assignment.role_id
JOIN tenant_roles AS teacher
  ON teacher.tenant_id = legacy.tenant_id
 AND teacher.role_key = 'TEACHER'
WHERE legacy.role_key = 'ADMIN'
ON CONFLICT (tenant_id, membership_id, role_id) DO NOTHING;

DELETE FROM user_roles AS assignment
USING tenant_roles AS legacy
WHERE assignment.tenant_id = legacy.tenant_id
  AND assignment.role_id = legacy.id
  AND legacy.role_key = 'ADMIN';

DELETE FROM role_permissions AS permission
USING tenant_roles AS legacy
WHERE permission.tenant_id = legacy.tenant_id
  AND permission.role_id = legacy.id
  AND legacy.role_key = 'ADMIN';

DELETE FROM tenant_roles
WHERE role_key = 'ADMIN';

CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'TEACHER');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
    ALTER COLUMN "role" TYPE "Role_new"
    USING ("role"::text)::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User"
    ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"Role";

COMMIT;
