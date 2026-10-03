-- Smart STEM AI target schema (PostgreSQL 15+).
-- Reference DDL only: review and migrate existing Prisma data before applying.
-- Execute as a schema owner in a dedicated database/schema.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE membership_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');
CREATE TYPE course_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE lesson_progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER');
CREATE TYPE assignment_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE submission_status AS ENUM ('SUBMITTED', 'LATE', 'GRADED', 'RETURNED');
CREATE TYPE conversation_status AS ENUM ('OPEN', 'CLOSED', 'FLAGGED');
CREATE TYPE ai_message_role AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
    default_locale text NOT NULL DEFAULT 'vi-VN',
    timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (id, slug)
);

CREATE TABLE schools (
    tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE RESTRICT,
    official_name text NOT NULL,
    short_name text,
    external_code text,
    address jsonb NOT NULL DEFAULT '{}'::jsonb,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, external_code)
);

-- Global identity; tenant-specific access is exclusively through memberships.
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name text NOT NULL,
    email text,
    email_verified_at timestamptz,
    phone_e164 text,
    phone_verified_at timestamptz,
    avatar_url text,
    locale text NOT NULL DEFAULT 'vi-VN',
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED')),
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CHECK (email IS NULL OR length(email) <= 320),
    CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);
CREATE UNIQUE INDEX users_email_ci_active_uq ON users (lower(email))
    WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX users_phone_active_uq ON users (phone_e164)
    WHERE phone_e164 IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX users_status_created_idx ON users (status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE auth_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider text NOT NULL,
    provider_subject text NOT NULL,
    provider_email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz,
    UNIQUE (provider, provider_subject),
    UNIQUE (user_id, provider)
);
CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);

CREATE TABLE auth_credentials (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
    password_hash text NOT NULL,
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    refresh_token_hash bytea NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    last_seen_at timestamptz,
    revoked_at timestamptz,
    ip_hash bytea,
    user_agent text,
    CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_active_idx ON auth_sessions (user_id, expires_at DESC)
    WHERE revoked_at IS NULL;
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions (expires_at);

CREATE TABLE auth_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    purpose text NOT NULL CHECK (purpose IN ('EMAIL_VERIFY', 'PASSWORD_RESET', 'INVITATION')),
    token_hash bytea NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    revoked_at timestamptz,
    CHECK (expires_at > created_at)
);
CREATE INDEX auth_tokens_user_purpose_idx ON auth_tokens (user_id, purpose, expires_at DESC)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE TABLE tenant_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status membership_status NOT NULL DEFAULT 'INVITED',
    member_code text,
    joined_at timestamptz,
    ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, user_id),
    UNIQUE (tenant_id, member_code),
    CHECK (ended_at IS NULL OR joined_at IS NULL OR ended_at >= joined_at)
);
CREATE INDEX memberships_user_idx ON tenant_memberships (user_id, status);
CREATE INDEX memberships_tenant_status_idx ON tenant_memberships (tenant_id, status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE permissions (
    id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_key text NOT NULL UNIQUE,
    description text NOT NULL
);

CREATE TABLE tenant_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    role_key text NOT NULL,
    display_name text NOT NULL,
    is_system_role boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, role_key)
);

CREATE TABLE role_permissions (
    tenant_id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id smallint NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, role_id, permission_id),
    FOREIGN KEY (tenant_id, role_id) REFERENCES tenant_roles(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE user_roles (
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    role_id uuid NOT NULL,
    granted_by_membership_id uuid,
    granted_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    PRIMARY KEY (tenant_id, membership_id, role_id),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, role_id) REFERENCES tenant_roles(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, granted_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE INDEX user_roles_role_idx ON user_roles (tenant_id, role_id)
    WHERE revoked_at IS NULL;

CREATE TABLE student_profiles (
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    date_of_birth date,
    grade_level smallint CHECK (grade_level BETWEEN 1 AND 12),
    preferred_language text NOT NULL DEFAULT 'vi',
    learning_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (tenant_id, membership_id),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE teacher_profiles (
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    employee_code text,
    department text,
    qualifications jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (tenant_id, membership_id),
    UNIQUE (tenant_id, employee_code),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE parent_profiles (
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    preferred_contact_method text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (tenant_id, membership_id),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE parent_student_links (
    tenant_id uuid NOT NULL,
    parent_membership_id uuid NOT NULL,
    student_membership_id uuid NOT NULL,
    relationship text NOT NULL,
    consent_status text NOT NULL DEFAULT 'PENDING'
        CHECK (consent_status IN ('PENDING', 'GRANTED', 'REVOKED')),
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    PRIMARY KEY (tenant_id, parent_membership_id, student_membership_id),
    FOREIGN KEY (tenant_id, parent_membership_id) REFERENCES parent_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    CHECK (parent_membership_id <> student_membership_id)
);
CREATE INDEX parent_student_child_idx ON parent_student_links (tenant_id, student_membership_id)
    WHERE ended_at IS NULL;

CREATE TABLE classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    class_code text NOT NULL,
    name text NOT NULL,
    grade_level smallint CHECK (grade_level BETWEEN 1 AND 12),
    academic_year text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, class_code, academic_year)
);
CREATE INDEX classes_tenant_year_idx ON classes (tenant_id, academic_year, grade_level)
    WHERE deleted_at IS NULL;

CREATE TABLE class_memberships (
    tenant_id uuid NOT NULL,
    class_id uuid NOT NULL,
    student_membership_id uuid NOT NULL,
    joined_at timestamptz NOT NULL DEFAULT now(),
    left_at timestamptz,
    PRIMARY KEY (tenant_id, class_id, student_membership_id, joined_at),
    FOREIGN KEY (tenant_id, class_id) REFERENCES classes(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    CHECK (left_at IS NULL OR left_at >= joined_at)
);
CREATE UNIQUE INDEX class_memberships_active_uq ON class_memberships
    (tenant_id, class_id, student_membership_id) WHERE left_at IS NULL;
CREATE INDEX class_memberships_student_idx ON class_memberships
    (tenant_id, student_membership_id, class_id) WHERE left_at IS NULL;

CREATE TABLE class_teachers (
    tenant_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_membership_id uuid NOT NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    PRIMARY KEY (tenant_id, class_id, teacher_membership_id, assigned_at),
    FOREIGN KEY (tenant_id, class_id) REFERENCES classes(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, teacher_membership_id) REFERENCES teacher_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);
CREATE UNIQUE INDEX class_teachers_active_uq ON class_teachers
    (tenant_id, class_id, teacher_membership_id) WHERE ended_at IS NULL;
CREATE INDEX class_teachers_teacher_idx ON class_teachers
    (tenant_id, teacher_membership_id, class_id) WHERE ended_at IS NULL;

CREATE TABLE subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    subject_key text NOT NULL,
    name_vi text NOT NULL,
    name_en text,
    description_vi text,
    description_en text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, subject_key)
);

CREATE TABLE topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    subject_id uuid NOT NULL,
    parent_topic_id uuid,
    topic_key text NOT NULL,
    name_vi text NOT NULL,
    name_en text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, subject_id, topic_key),
    FOREIGN KEY (tenant_id, subject_id) REFERENCES subjects(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, parent_topic_id) REFERENCES topics(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX topics_parent_idx ON topics (tenant_id, parent_topic_id)
    WHERE deleted_at IS NULL;

CREATE TABLE courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    subject_id uuid NOT NULL,
    primary_topic_id uuid,
    created_by_membership_id uuid,
    slug text NOT NULL,
    title_vi text NOT NULL,
    title_en text,
    description_vi text,
    description_en text,
    grade_min smallint CHECK (grade_min BETWEEN 1 AND 12),
    grade_max smallint CHECK (grade_max BETWEEN 1 AND 12),
    status course_status NOT NULL DEFAULT 'DRAFT',
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, slug),
    FOREIGN KEY (tenant_id, subject_id) REFERENCES subjects(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, primary_topic_id) REFERENCES topics(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, created_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (grade_min IS NULL OR grade_max IS NULL OR grade_min <= grade_max)
);
CREATE INDEX courses_catalog_idx ON courses (tenant_id, status, subject_id, updated_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX courses_creator_idx ON courses (tenant_id, created_by_membership_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE class_courses (
    tenant_id uuid NOT NULL,
    class_id uuid NOT NULL,
    course_id uuid NOT NULL,
    assigned_by_membership_id uuid,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    due_at timestamptz,
    ended_at timestamptz,
    PRIMARY KEY (tenant_id, class_id, course_id, assigned_at),
    FOREIGN KEY (tenant_id, class_id) REFERENCES classes(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, course_id) REFERENCES courses(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, assigned_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (due_at IS NULL OR due_at >= assigned_at)
);
CREATE UNIQUE INDEX class_courses_active_uq ON class_courses (tenant_id, class_id, course_id)
    WHERE ended_at IS NULL;
CREATE INDEX class_courses_course_idx ON class_courses (tenant_id, course_id, class_id)
    WHERE ended_at IS NULL;

CREATE TABLE lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    course_id uuid NOT NULL,
    position integer NOT NULL CHECK (position >= 0),
    slug text NOT NULL,
    title_vi text NOT NULL,
    title_en text,
    description_vi text,
    description_en text,
    duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, course_id, position),
    UNIQUE (tenant_id, course_id, slug),
    FOREIGN KEY (tenant_id, course_id) REFERENCES courses(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX lessons_course_order_idx ON lessons (tenant_id, course_id, position)
    WHERE deleted_at IS NULL;

CREATE TABLE videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lesson_id uuid NOT NULL,
    position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
    title_vi text NOT NULL,
    title_en text,
    provider text NOT NULL DEFAULT 'EXTERNAL',
    provider_video_id text,
    playback_url text NOT NULL,
    duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    captions jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, lesson_id, position),
    FOREIGN KEY (tenant_id, lesson_id) REFERENCES lessons(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX videos_lesson_idx ON videos (tenant_id, lesson_id, position)
    WHERE deleted_at IS NULL;

CREATE TABLE quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lesson_id uuid NOT NULL,
    title_vi text NOT NULL,
    title_en text,
    passing_score_percent smallint NOT NULL DEFAULT 60 CHECK (passing_score_percent BETWEEN 0 AND 100),
    max_attempts smallint CHECK (max_attempts IS NULL OR max_attempts > 0),
    time_limit_seconds integer CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    is_published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, lesson_id) REFERENCES lessons(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX quizzes_lesson_idx ON quizzes (tenant_id, lesson_id)
    WHERE deleted_at IS NULL;

CREATE TABLE questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    quiz_id uuid NOT NULL,
    position integer NOT NULL CHECK (position >= 0),
    question_type question_type NOT NULL,
    prompt_vi text NOT NULL,
    prompt_en text,
    explanation_vi text,
    explanation_en text,
    points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, quiz_id, id),
    UNIQUE (tenant_id, quiz_id, position),
    FOREIGN KEY (tenant_id, quiz_id) REFERENCES quizzes(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX questions_quiz_order_idx ON questions (tenant_id, quiz_id, position)
    WHERE deleted_at IS NULL;

CREATE TABLE question_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    question_id uuid NOT NULL,
    position integer NOT NULL CHECK (position >= 0),
    text_vi text NOT NULL,
    text_en text,
    is_correct boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, question_id, position),
    UNIQUE (tenant_id, question_id, id),
    FOREIGN KEY (tenant_id, question_id) REFERENCES questions(tenant_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX question_options_single_correct_uq ON question_options (tenant_id, question_id)
    WHERE is_correct;

CREATE TABLE interactive_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    video_id uuid NOT NULL,
    position_ms integer NOT NULL CHECK (position_ms >= 0),
    event_type text NOT NULL CHECK (event_type IN ('QUESTION', 'EXPLANATION', 'QUIZ')),
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, video_id, position_ms),
    FOREIGN KEY (tenant_id, video_id) REFERENCES videos(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX interactive_events_timeline_idx ON interactive_events (tenant_id, video_id, position_ms)
    WHERE deleted_at IS NULL;

CREATE TABLE assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    class_id uuid NOT NULL,
    course_id uuid,
    lesson_id uuid,
    created_by_membership_id uuid NOT NULL,
    title_vi text NOT NULL,
    title_en text,
    instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
    status assignment_status NOT NULL DEFAULT 'DRAFT',
    available_at timestamptz,
    due_at timestamptz,
    max_score numeric(8,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, class_id) REFERENCES classes(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, course_id) REFERENCES courses(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, lesson_id) REFERENCES lessons(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, created_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (due_at IS NULL OR available_at IS NULL OR due_at >= available_at)
);
CREATE INDEX assignments_class_due_idx ON assignments (tenant_id, class_id, due_at)
    WHERE deleted_at IS NULL AND status = 'PUBLISHED';

CREATE TABLE assignment_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    assignment_id uuid NOT NULL,
    student_membership_id uuid NOT NULL,
    attempt_number smallint NOT NULL CHECK (attempt_number > 0),
    status submission_status NOT NULL DEFAULT 'SUBMITTED',
    submitted_at timestamptz NOT NULL DEFAULT now(),
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    score numeric(8,2),
    feedback text,
    graded_by_membership_id uuid,
    graded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, assignment_id, student_membership_id, attempt_number),
    FOREIGN KEY (tenant_id, assignment_id) REFERENCES assignments(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, graded_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (score IS NULL OR score >= 0),
    CHECK (graded_at IS NULL OR graded_at >= submitted_at)
);
CREATE INDEX submissions_student_history_idx ON assignment_submissions
    (tenant_id, student_membership_id, submitted_at DESC);
CREATE INDEX submissions_assignment_status_idx ON assignment_submissions
    (tenant_id, assignment_id, status, submitted_at DESC);

CREATE TABLE lesson_progress (
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    student_membership_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status lesson_progress_status NOT NULL DEFAULT 'NOT_STARTED',
    completion_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    last_position_seconds integer NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
    score numeric(8,2),
    started_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, student_membership_id, lesson_id),
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, lesson_id) REFERENCES lessons(tenant_id, id) ON DELETE RESTRICT,
    CHECK (score IS NULL OR score >= 0),
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX lesson_progress_student_idx ON lesson_progress
    (tenant_id, student_membership_id, status, updated_at DESC);
CREATE INDEX lesson_progress_lesson_idx ON lesson_progress
    (tenant_id, lesson_id, status, updated_at DESC);

CREATE TABLE quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    quiz_id uuid NOT NULL,
    student_membership_id uuid NOT NULL,
    attempt_number smallint NOT NULL CHECK (attempt_number > 0),
    started_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    score numeric(8,2),
    max_score numeric(8,2) NOT NULL CHECK (max_score > 0),
    percentage numeric(5,2) CHECK (percentage BETWEEN 0 AND 100),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, quiz_id, id),
    UNIQUE (tenant_id, quiz_id, student_membership_id, attempt_number),
    FOREIGN KEY (tenant_id, quiz_id) REFERENCES quizzes(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    CHECK (submitted_at IS NULL OR submitted_at >= started_at),
    CHECK (score IS NULL OR score >= 0)
);
CREATE INDEX quiz_attempts_student_idx ON quiz_attempts
    (tenant_id, student_membership_id, submitted_at DESC);
CREATE INDEX quiz_attempts_quiz_idx ON quiz_attempts
    (tenant_id, quiz_id, student_membership_id, submitted_at DESC);

CREATE TABLE quiz_responses (
    tenant_id uuid NOT NULL,
    attempt_id uuid NOT NULL,
    quiz_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_text text,
    is_correct boolean,
    awarded_score numeric(8,2) CHECK (awarded_score IS NULL OR awarded_score >= 0),
    answered_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, attempt_id, question_id),
    FOREIGN KEY (tenant_id, quiz_id, attempt_id) REFERENCES quiz_attempts(tenant_id, quiz_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, quiz_id, question_id) REFERENCES questions(tenant_id, quiz_id, id) ON DELETE RESTRICT
);
CREATE INDEX quiz_responses_question_idx ON quiz_responses (tenant_id, question_id, answered_at DESC);

CREATE TABLE quiz_response_options (
    tenant_id uuid NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    option_id uuid NOT NULL,
    PRIMARY KEY (tenant_id, attempt_id, question_id, option_id),
    FOREIGN KEY (tenant_id, attempt_id, question_id)
        REFERENCES quiz_responses(tenant_id, attempt_id, question_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, question_id, option_id)
        REFERENCES question_options(tenant_id, question_id, id) ON DELETE RESTRICT
);

CREATE TABLE vocabulary_terms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    subject_id uuid NOT NULL,
    topic_id uuid,
    term text NOT NULL,
    term_en text,
    definition_vi text NOT NULL,
    definition_en text,
    pronunciation text,
    example_vi text,
    example_en text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, subject_id, term),
    FOREIGN KEY (tenant_id, subject_id) REFERENCES subjects(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, topic_id) REFERENCES topics(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX vocabulary_topic_idx ON vocabulary_terms (tenant_id, topic_id)
    WHERE deleted_at IS NULL;

CREATE TABLE learner_vocabulary (
    tenant_id uuid NOT NULL,
    student_membership_id uuid NOT NULL,
    vocabulary_term_id uuid NOT NULL,
    mastery smallint NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 5),
    times_seen integer NOT NULL DEFAULT 0 CHECK (times_seen >= 0),
    times_correct integer NOT NULL DEFAULT 0 CHECK (times_correct >= 0 AND times_correct <= times_seen),
    next_review_at timestamptz,
    last_reviewed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, student_membership_id, vocabulary_term_id),
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, vocabulary_term_id) REFERENCES vocabulary_terms(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX learner_vocabulary_due_idx ON learner_vocabulary
    (tenant_id, student_membership_id, next_review_at)
    WHERE mastery < 5;

CREATE TABLE badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    badge_key text NOT NULL,
    name_vi text NOT NULL,
    name_en text,
    description_vi text,
    description_en text,
    icon_url text,
    criteria jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, badge_key)
);

CREATE TABLE achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    student_membership_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    awarded_at timestamptz NOT NULL DEFAULT now(),
    awarded_by_membership_id uuid,
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    revoked_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, student_membership_id, badge_id),
    FOREIGN KEY (tenant_id, student_membership_id) REFERENCES student_profiles(tenant_id, membership_id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, badge_id) REFERENCES badges(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, awarded_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX achievements_student_idx ON achievements
    (tenant_id, student_membership_id, awarded_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE ai_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    owner_membership_id uuid NOT NULL,
    course_id uuid,
    lesson_id uuid,
    title text,
    status conversation_status NOT NULL DEFAULT 'OPEN',
    provider text NOT NULL,
    model text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, owner_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, course_id) REFERENCES courses(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, lesson_id) REFERENCES lessons(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX ai_conversations_owner_idx ON ai_conversations
    (tenant_id, owner_membership_id, updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE ai_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    conversation_id uuid NOT NULL,
    sequence_number integer NOT NULL CHECK (sequence_number > 0),
    role ai_message_role NOT NULL,
    content text NOT NULL,
    input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
    safety_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, conversation_id, sequence_number),
    FOREIGN KEY (tenant_id, conversation_id) REFERENCES ai_conversations(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX ai_messages_conversation_idx ON ai_messages (tenant_id, conversation_id, sequence_number);

CREATE TABLE report_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    report_key text NOT NULL,
    name text NOT NULL,
    parameters_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by_membership_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, report_key),
    FOREIGN KEY (tenant_id, created_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE report_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    report_definition_id uuid NOT NULL,
    requested_by_membership_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
    result_uri text,
    error_code text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    expires_at timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, report_definition_id) REFERENCES report_definitions(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, requested_by_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX report_runs_requester_idx ON report_runs (tenant_id, requested_by_membership_id, requested_at DESC);

-- High-volume append-only analytics. Create future monthly partitions in advance.
CREATE TABLE learning_events (
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    occurred_at timestamptz NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    actor_membership_id uuid,
    event_name text NOT NULL,
    entity_type text,
    entity_id uuid,
    session_id uuid,
    request_id uuid,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (tenant_id, occurred_at, id),
    FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
) PARTITION BY RANGE (occurred_at);
CREATE TABLE learning_events_default PARTITION OF learning_events DEFAULT;
CREATE INDEX learning_events_actor_time_idx ON learning_events
    (tenant_id, actor_membership_id, occurred_at DESC);
CREATE INDEX learning_events_name_time_idx ON learning_events
    (tenant_id, event_name, occurred_at DESC);

-- Audit snapshots are restricted and must not contain credentials or full AI content.
CREATE TABLE audit_log (
    occurred_at timestamptz NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    actor_user_id uuid,
    actor_membership_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    request_id uuid,
    before_row jsonb,
    after_row jsonb,
    PRIMARY KEY (occurred_at, id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES tenant_memberships(tenant_id, id) ON DELETE RESTRICT
) PARTITION BY RANGE (occurred_at);
CREATE TABLE audit_log_default PARTITION OF audit_log DEFAULT;
CREATE INDEX audit_log_tenant_time_idx ON audit_log (tenant_id, occurred_at DESC);
CREATE INDEX audit_log_record_idx ON audit_log (tenant_id, table_name, record_id, occurred_at DESC);

-- Reusable audit trigger. Configure actor/request with SET LOCAL before writes.
CREATE FUNCTION write_audit_log() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    before_data jsonb;
    after_data jsonb;
    row_data jsonb;
    row_tenant uuid;
    row_id text;
BEGIN
    IF TG_OP <> 'INSERT' THEN before_data := to_jsonb(OLD); END IF;
    IF TG_OP <> 'DELETE' THEN after_data := to_jsonb(NEW); END IF;
    row_data := COALESCE(after_data, before_data);
    row_tenant := NULLIF(row_data ->> 'tenant_id', '')::uuid;
    row_id := COALESCE(row_data ->> 'id', row_data ->> 'membership_id', row_data ->> 'user_id', 'unknown');
    IF TG_TABLE_NAME = 'user_roles' THEN
        row_id := (row_data ->> 'membership_id') || ':' || (row_data ->> 'role_id');
    END IF;

    INSERT INTO audit_log (
        tenant_id, actor_user_id, actor_membership_id, action, table_name, record_id,
        request_id, before_row, after_row
    ) VALUES (
        row_tenant,
        NULLIF(current_setting('app.user_id', true), '')::uuid,
        NULLIF(current_setting('app.membership_id', true), '')::uuid,
        TG_OP, TG_TABLE_NAME, row_id,
        NULLIF(current_setting('app.request_id', true), '')::uuid,
        before_data, after_data
    );
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER audit_tenant_memberships AFTER INSERT OR UPDATE OR DELETE ON tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
CREATE TRIGGER audit_classes AFTER INSERT OR UPDATE OR DELETE ON classes
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
CREATE TRIGGER audit_courses AFTER INSERT OR UPDATE OR DELETE ON courses
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
CREATE TRIGGER audit_lessons AFTER INSERT OR UPDATE OR DELETE ON lessons
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
CREATE TRIGGER audit_assignments AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();

CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    table_record record;
BEGIN
    FOR table_record IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'updated_at' AND NOT a.attisdropped
        WHERE n.nspname = current_schema()
          AND c.relkind = 'r'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',
            'touch_updated_at_' || table_record.relname,
            table_record.relname
        );
    END LOOP;
END
$$;

-- Enable tenant RLS for every table with a tenant_id column, except append-only
-- audit, which receives an explicit tenant policy below.
DO $$
DECLARE
    table_record record;
BEGIN
    FOR table_record IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
        WHERE n.nspname = current_schema()
          AND c.relkind = 'r'
          AND c.relname NOT IN ('audit_log', 'audit_log_default')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.relname);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
            table_record.relname
        );
    END LOOP;
END
$$;

-- Policies on partition roots apply when accessed through the root. Do not grant
-- direct access to partitions; if that is required, add a policy to each partition.
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON learning_events
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
ALTER TABLE audit_log_default ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log_default
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

COMMIT;

-- Monthly partition example (run before the month begins; use UTC boundaries):
-- CREATE TABLE learning_events_2026_11 PARTITION OF learning_events
--   FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
-- CREATE TABLE audit_log_2026_11 PARTITION OF audit_log
--   FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
--
-- Set context inside the same transaction/pooled connection:
-- BEGIN;
-- SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000000';
-- SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000000';
-- SET LOCAL app.membership_id = '00000000-0000-0000-0000-000000000000';
-- SET LOCAL app.request_id = '00000000-0000-0000-0000-000000000000';
-- ... tenant-scoped statements ...
-- COMMIT;
