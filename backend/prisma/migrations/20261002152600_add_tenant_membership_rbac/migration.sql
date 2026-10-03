CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');

CREATE TABLE tenants (
    id UUID NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX tenants_slug_key ON tenants(slug);

CREATE TABLE schools (
    tenant_id UUID NOT NULL,
    official_name TEXT NOT NULL,
    short_name TEXT,
    external_code TEXT,
    address JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT schools_pkey PRIMARY KEY (tenant_id),
    CONSTRAINT schools_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX schools_tenant_id_external_code_key ON schools(tenant_id, external_code);

CREATE TABLE tenant_memberships (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    status "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    member_code TEXT,
    joined_at TIMESTAMP(3) WITH TIME ZONE,
    ended_at TIMESTAMP(3) WITH TIME ZONE,
    created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT tenant_memberships_pkey PRIMARY KEY (id),
    CONSTRAINT tenant_memberships_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT tenant_memberships_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT tenant_memberships_period_check
        CHECK (ended_at IS NULL OR joined_at IS NULL OR ended_at >= joined_at)
);

CREATE UNIQUE INDEX tenant_memberships_tenant_id_id_key ON tenant_memberships(tenant_id, id);
CREATE UNIQUE INDEX tenant_memberships_tenant_id_user_id_key ON tenant_memberships(tenant_id, user_id);
CREATE UNIQUE INDEX tenant_memberships_tenant_id_member_code_key ON tenant_memberships(tenant_id, member_code);
CREATE INDEX tenant_memberships_user_id_status_idx ON tenant_memberships(user_id, status);
CREATE INDEX tenant_memberships_tenant_id_status_created_at_idx
    ON tenant_memberships(tenant_id, status, created_at);

CREATE TABLE tenant_roles (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    role_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT tenant_roles_pkey PRIMARY KEY (id),
    CONSTRAINT tenant_roles_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX tenant_roles_tenant_id_id_key ON tenant_roles(tenant_id, id);
CREATE UNIQUE INDEX tenant_roles_tenant_id_role_key_key ON tenant_roles(tenant_id, role_key);

CREATE TABLE permissions (
    id SERIAL NOT NULL,
    permission_key TEXT NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX permissions_permission_key_key ON permissions(permission_key);

CREATE TABLE role_permissions (
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (tenant_id, role_id, permission_id),
    CONSTRAINT role_permissions_role_fkey
        FOREIGN KEY (tenant_id, role_id) REFERENCES tenant_roles(tenant_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT role_permissions_permission_id_fkey
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE user_roles (
    tenant_id UUID NOT NULL,
    membership_id UUID NOT NULL,
    role_id UUID NOT NULL,
    granted_by_membership_id UUID,
    granted_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT user_roles_pkey PRIMARY KEY (tenant_id, membership_id, role_id),
    CONSTRAINT user_roles_membership_fkey
        FOREIGN KEY (tenant_id, membership_id) REFERENCES tenant_memberships(tenant_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT user_roles_role_fkey
        FOREIGN KEY (tenant_id, role_id) REFERENCES tenant_roles(tenant_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT user_roles_granted_by_fkey
        FOREIGN KEY (tenant_id, granted_by_membership_id) REFERENCES tenant_memberships(tenant_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT user_roles_period_check CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE INDEX user_roles_tenant_id_role_id_revoked_at_idx
    ON user_roles(tenant_id, role_id, revoked_at);

-- One initial tenant preserves the current single-school deployment model.
-- Replace its school profile with real deployment data before onboarding tenants.
INSERT INTO tenants (id, slug, name)
VALUES ('8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', 'smart-stem', 'Smart STEM AI');

INSERT INTO schools (tenant_id, official_name, short_name)
VALUES ('8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', 'Smart STEM AI', 'Smart STEM');

INSERT INTO tenant_roles (id, tenant_id, role_key, display_name, is_system_role)
VALUES
    ('56f49c78-b7c5-4c8f-86af-4216719e8d01', '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', 'STUDENT', 'Student', true),
    ('56f49c78-b7c5-4c8f-86af-4216719e8d02', '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', 'TEACHER', 'Teacher', true),
    ('56f49c78-b7c5-4c8f-86af-4216719e8d03', '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', 'ADMIN', 'Administrator', true);

INSERT INTO permissions (permission_key, description)
VALUES
    ('learning:read', 'Read learning content and learner progress'),
    ('learning:write', 'Update own learning progress and submit assessments'),
    ('ai:use', 'Use the AI learning assistant'),
    ('courses:write', 'Create and manage courses'),
    ('assignments:write', 'Create and grade assignments'),
    ('reports:class:read', 'Read reports for assigned classes'),
    ('school:members:manage', 'Manage school memberships and roles'),
    ('school:settings:manage', 'Manage school settings');

INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', roles.id, permissions.id
FROM tenant_roles AS roles
CROSS JOIN permissions
WHERE roles.tenant_id = '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01'
  AND (
      (roles.role_key = 'STUDENT' AND permissions.permission_key IN ('learning:read', 'learning:write', 'ai:use'))
      OR (roles.role_key = 'TEACHER' AND permissions.permission_key IN (
          'learning:read', 'learning:write', 'courses:write', 'assignments:write',
          'reports:class:read', 'ai:use'
      ))
      OR (roles.role_key = 'ADMIN')
  );

INSERT INTO tenant_memberships (id, tenant_id, user_id, status, joined_at)
SELECT gen_random_uuid(), '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01', users.id, 'ACTIVE', CURRENT_TIMESTAMP
FROM "User" AS users;

INSERT INTO user_roles (tenant_id, membership_id, role_id)
SELECT memberships.tenant_id, memberships.id, roles.id
FROM tenant_memberships AS memberships
JOIN "User" AS users ON users.id = memberships.user_id
JOIN tenant_roles AS roles
  ON roles.tenant_id = memberships.tenant_id
 AND roles.role_key = users.role::text
WHERE memberships.tenant_id = '8d45f3b7-92a1-4e8e-a83c-b52c998e2f01';
