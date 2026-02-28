# SmartAI Backend Migration Plan

> Replace Kilo Cloud (`api.kilo.ai`) with your own Spring Boot backend.

---

## OVERVIEW

Currently, the Kilocode app calls `https://api.kilo.ai` for:
1. Authentication (login/signup)
2. User profile
3. Balance/billing
4. Notifications
5. Organization/team management
6. Cloud session sync
7. FIM (autocomplete) completions
8. Default model settings

**Goal:** Point all these calls to YOUR Spring Boot server instead.

---

## STEP 1: Change the Base URL (1 file)

**File:** `packages/kilo-gateway/src/api/constants.ts`

```typescript
// CHANGE THIS:
export const DEFAULT_KILO_API_URL = "https://api.kilo.ai"

// TO THIS:
export const DEFAULT_KILO_API_URL = "https://your-smartai-server.com"
```

After this change, ALL API calls will go to your server. Now you need to build the APIs.

---

## STEP 2: APIs Your Spring Boot Backend Must Implement

### API 1: Device Auth - Initiate
**Called from:** `packages/kilo-gateway/src/auth/device-auth-tui.ts` (line 14)

```
POST /api/device-auth/codes
Content-Type: application/json

Response 200:
{
  "code": "ABC123",                           // 6-char verification code
  "verificationUrl": "https://your-site.com/verify?code=ABC123",
  "expiresIn": 600                            // seconds until code expires
}

Response 429: Too many requests
```

**Spring Boot:**
```java
@PostMapping("/api/device-auth/codes")
public ResponseEntity<DeviceAuthResponse> initiateAuth() {
    String code = generateRandomCode();
    // Store code in DB with expiry
    return ResponseEntity.ok(new DeviceAuthResponse(code, verificationUrl, 600));
}
```

---

### API 2: Device Auth - Poll
**Called from:** `packages/kilo-gateway/src/auth/device-auth-tui.ts` (line 39)

```
GET /api/device-auth/codes/{code}

Response 202: { "status": "pending" }          // User hasn't approved yet
Response 200: { "status": "approved", "token": "jwt-token-here", "userEmail": "user@email.com" }
Response 403: { "status": "denied" }           // User denied
Response 410: { "status": "expired" }          // Code expired
```

**Spring Boot:**
```java
@GetMapping("/api/device-auth/codes/{code}")
public ResponseEntity<?> pollAuth(@PathVariable String code) {
    DeviceAuth auth = deviceAuthRepo.findByCode(code);
    if (auth == null || auth.isExpired()) return ResponseEntity.status(410).body(Map.of("status", "expired"));
    if (auth.isDenied()) return ResponseEntity.status(403).body(Map.of("status", "denied"));
    if (auth.isApproved()) return ResponseEntity.ok(Map.of(
        "status", "approved",
        "token", jwtService.generateToken(auth.getUser()),
        "userEmail", auth.getUser().getEmail()
    ));
    return ResponseEntity.status(202).body(Map.of("status", "pending"));
}
```

---

### API 3: User Profile
**Called from:** `packages/kilo-gateway/src/api/profile.ts` (line 9)

```
GET /api/profile
Authorization: Bearer {token}

Response 200:
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "organizations": [
    { "id": "org_123", "name": "My Team", "role": "admin" },
    { "id": "org_456", "name": "Company", "role": "member" }
  ]
}

Response 401: Invalid token
Response 403: Forbidden
```

**Spring Boot:**
```java
@GetMapping("/api/profile")
public ResponseEntity<ProfileResponse> getProfile(@RequestHeader("Authorization") String token) {
    User user = authService.validateToken(token);
    List<Organization> orgs = orgService.getUserOrgs(user.getId());
    return ResponseEntity.ok(new ProfileResponse(user, orgs));
}
```

---

### API 4: Balance
**Called from:** `packages/kilo-gateway/src/api/profile.ts` (line 48)

```
GET /api/profile/balance
Authorization: Bearer {token}
x-kilocode-organizationid: org_123    (optional, for team balance)

Response 200:
{
  "balance": 25.50    // USD balance remaining
}
```

**Spring Boot:**
```java
@GetMapping("/api/profile/balance")
public ResponseEntity<BalanceResponse> getBalance(
    @RequestHeader("Authorization") String token,
    @RequestHeader(value = "x-kilocode-organizationid", required = false) String orgId
) {
    User user = authService.validateToken(token);
    double balance = billingService.getBalance(user.getId(), orgId);
    return ResponseEntity.ok(new BalanceResponse(balance));
}
```

---

### API 5: Default Model
**Called from:** `packages/kilo-gateway/src/api/profile.ts` (line 83)

```
GET /api/defaults
Authorization: Bearer {token}     (optional)

Response 200 (authenticated):
{
  "defaultModel": "anthropic/claude-sonnet-4"
}

Response 200 (anonymous):
{
  "defaultFreeModel": "minimax/minimax-m2.1:free"
}
```

For organization-specific defaults:
```
GET /api/organizations/{orgId}/defaults
Authorization: Bearer {token}

Response 200:
{
  "defaultModel": "anthropic/claude-sonnet-4"
}
```

**Spring Boot:**
```java
@GetMapping("/api/defaults")
public ResponseEntity<DefaultsResponse> getDefaults(
    @RequestHeader(value = "Authorization", required = false) String token
) {
    if (token != null) {
        return ResponseEntity.ok(new DefaultsResponse("anthropic/claude-sonnet-4", null));
    }
    return ResponseEntity.ok(new DefaultsResponse(null, "minimax/minimax-m2.1:free"));
}
```

---

### API 6: Notifications
**Called from:** `packages/kilo-gateway/src/server/routes.ts` (line 295)

```
GET /api/notifications
Authorization: Bearer {token}
x-kilocode-organizationid: org_123    (optional)

Response 200:
[
  {
    "id": "notif_1",
    "type": "info",           // "info" | "warning" | "error" | "update"
    "title": "Welcome!",
    "message": "Thanks for signing up",
    "dismissible": true,
    "createdAt": "2026-02-28T10:00:00Z"
  }
]
```

**Spring Boot:**
```java
@GetMapping("/api/notifications")
public ResponseEntity<List<NotificationResponse>> getNotifications(
    @RequestHeader("Authorization") String token
) {
    User user = authService.validateToken(token);
    return ResponseEntity.ok(notificationService.getForUser(user.getId()));
}
```

---

### API 7: Cloud Sessions List
**Called from:** `packages/kilo-gateway/src/server/routes.ts` (line 456)

```
GET /api/trpc/cliSessionsV2.list?batch=1&input={"0":{"cursor":"...","limit":20,"gitUrl":"..."}}
Authorization: Bearer {token}

Response 200:
[
  {
    "result": {
      "data": {
        "json": {
          "cliSessions": [
            {
              "session_id": "sess_123",
              "title": "Fix login bug",
              "created_at": "2026-02-28T10:00:00Z",
              "updated_at": "2026-02-28T11:00:00Z",
              "version": 1
            }
          ],
          "nextCursor": null
        }
      }
    }
  }
]
```

**Spring Boot:**
```java
@GetMapping("/api/trpc/cliSessionsV2.list")
public ResponseEntity<List<TrpcResponse>> listSessions(
    @RequestParam String batch,
    @RequestParam String input,
    @RequestHeader("Authorization") String token
) {
    // Parse tRPC-style input
    User user = authService.validateToken(token);
    List<CloudSession> sessions = sessionService.listForUser(user.getId());
    return ResponseEntity.ok(wrapInTrpcFormat(sessions));
}
```

---

### API 8: Cloud Session - Get Single
**Called from:** `packages/kilo-gateway/src/server/routes.ts` (line 330)

```
GET /api/cli-sessions/{sessionId}/export
Authorization: Bearer {token}

Response 200:
{
  "info": { "id": "sess_123", "title": "...", ... },
  "messages": [...],
  "parts": [...]
}
```

---

### API 9: FIM Completions (Autocomplete)
**Called from:** `packages/kilo-gateway/src/server/routes.ts` (line 234)

```
POST /api/fim/completions
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "model": "mistralai/codestral-2501",
  "prompt": "function hello() {",        // code before cursor
  "suffix": "\nconsole.log('done')",      // code after cursor
  "max_tokens": 256,
  "temperature": 0.2,
  "stream": true
}

Response: SSE stream (OpenAI-compatible format)
```

---

## STEP 3: Frontend Files That Call These APIs

These files in the Kilocode repo make the API calls. You may need to tweak them if your response format differs slightly:

| File | What it calls |
|------|---------------|
| `packages/kilo-gateway/src/api/constants.ts` | Base URL definition |
| `packages/kilo-gateway/src/api/profile.ts` | `/api/profile`, `/api/profile/balance`, `/api/defaults` |
| `packages/kilo-gateway/src/api/notifications.ts` | `/api/notifications` |
| `packages/kilo-gateway/src/auth/device-auth-tui.ts` | `/api/device-auth/codes` (POST + GET poll) |
| `packages/kilo-gateway/src/auth/device-auth.ts` | Same as above (legacy version) |
| `packages/kilo-gateway/src/server/routes.ts` | `/kilo/profile`, `/kilo/organization`, `/kilo/fim`, `/kilo/notifications`, `/kilo/cloud-sessions`, `/kilo/cloud/session/import` |
| `packages/kilo-gateway/src/provider.ts` | OpenRouter proxy for AI model calls |
| `packages/kilo-gateway/src/cloud-sessions.ts` | Cloud session fetch and import |

---

## STEP 4: Spring Boot Database Tables

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing / Balance
CREATE TABLE billing (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    balance DECIMAL(10,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token usage / transactions log
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    org_id VARCHAR(36),
    session_id VARCHAR(255),
    model VARCHAR(255),
    tokens_input INT DEFAULT 0,
    tokens_output INT DEFAULT 0,
    tokens_reasoning INT DEFAULT 0,
    tokens_cache_read INT DEFAULT 0,
    tokens_cache_write INT DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations / Teams
CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization members
CREATE TABLE org_members (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, user_id)
);

-- Device auth codes (temporary, for login flow)
CREATE TABLE device_auth_codes (
    code VARCHAR(10) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    verification_url VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    type VARCHAR(20) DEFAULT 'info',
    title VARCHAR(255),
    message TEXT,
    dismissible BOOLEAN DEFAULT TRUE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cloud sessions (synced from client)
CREATE TABLE cloud_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    data JSON,
    git_url VARCHAR(500),
    version INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## STEP 5: Spring Boot Project Structure

```
smartai-backend/
├── src/main/java/com/smartai/
│   ├── SmartAiApplication.java
│   │
│   ├── config/
│   │   ├── SecurityConfig.java          ← JWT filter, CORS
│   │   └── JwtConfig.java              ← JWT secret, expiry
│   │
│   ├── auth/
│   │   ├── AuthController.java          ← POST /api/device-auth/codes
│   │   │                                  GET  /api/device-auth/codes/{code}
│   │   ├── DeviceAuthService.java       ← Code generation, polling logic
│   │   ├── JwtTokenService.java         ← Token create/validate
│   │   ├── DeviceAuthCode.java          ← Entity
│   │   └── DeviceAuthRepository.java    ← JPA repo
│   │
│   ├── user/
│   │   ├── UserController.java          ← GET /api/profile
│   │   ├── UserService.java
│   │   ├── User.java                    ← Entity
│   │   └── UserRepository.java
│   │
│   ├── billing/
│   │   ├── BillingController.java       ← GET /api/profile/balance
│   │   ├── BillingService.java          ← Balance calc, cost tracking
│   │   ├── Billing.java                 ← Entity
│   │   ├── Transaction.java             ← Entity
│   │   ├── BillingRepository.java
│   │   └── TransactionRepository.java
│   │
│   ├── organization/
│   │   ├── OrgController.java           ← Org CRUD
│   │   ├── OrgService.java
│   │   ├── Organization.java            ← Entity
│   │   ├── OrgMember.java               ← Entity
│   │   ├── OrgRepository.java
│   │   └── OrgMemberRepository.java
│   │
│   ├── notification/
│   │   ├── NotificationController.java  ← GET /api/notifications
│   │   ├── NotificationService.java
│   │   ├── Notification.java            ← Entity
│   │   └── NotificationRepository.java
│   │
│   ├── session/
│   │   ├── CloudSessionController.java  ← GET /api/trpc/cliSessionsV2.list
│   │   │                                  GET /api/cli-sessions/{id}/export
│   │   ├── CloudSessionService.java
│   │   ├── CloudSession.java            ← Entity
│   │   └── CloudSessionRepository.java
│   │
│   └── defaults/
│       ├── DefaultsController.java      ← GET /api/defaults
│       │                                  GET /api/organizations/{id}/defaults
│       └── DefaultsService.java
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                    ← Flyway migrations
│       └── V1__init.sql
│
└── pom.xml
```

---

## STEP 6: Headers Your Backend Should Understand

These headers are sent by the Kilocode app. Your backend should read them:

| Header | Purpose | Required? |
|--------|---------|-----------|
| `Authorization` | `Bearer {jwt-token}` | Yes (for authenticated endpoints) |
| `X-KILOCODE-ORGANIZATIONID` | Current organization context | Optional |
| `X-KILOCODE-TASKID` | Task tracking ID | Optional (for analytics) |
| `X-KILOCODE-PROJECTID` | Project tracking ID | Optional (for analytics) |
| `X-KILOCODE-FEATURE` | Feature tracking (e.g., "autocomplete") | Optional (for analytics) |
| `X-KILOCODE-EDITORNAME` | Editor name (e.g., "Kilo CLI") | Optional (for analytics) |
| `X-KILOCODE-MACHINEID` | Machine identifier | Optional (for analytics) |

---

## STEP 7: Dependencies for Spring Boot

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.6</version>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## STEP 8: Verification Checklist

After building your backend, test each API:

- [ ] `POST /api/device-auth/codes` → Returns code + URL
- [ ] `GET /api/device-auth/codes/{code}` → Returns pending/approved/denied/expired
- [ ] `GET /api/profile` → Returns user email, name, organizations
- [ ] `GET /api/profile/balance` → Returns balance number
- [ ] `GET /api/defaults` → Returns defaultModel string
- [ ] `GET /api/organizations/{id}/defaults` → Returns org defaultModel
- [ ] `GET /api/notifications` → Returns notification array
- [ ] `GET /api/trpc/cliSessionsV2.list` → Returns sessions in tRPC format
- [ ] `POST /api/fim/completions` → Returns SSE stream (hardest one)

---

## STEP 9: Optional - Replace Auth Flow Entirely

If you don't want device auth (code + browser), you can replace it with simple email/password:

1. Modify `packages/kilo-gateway/src/auth/device-auth-tui.ts`
2. Instead of opening browser, show login prompts in the TUI
3. Call `POST /api/auth/login` with email + password
4. Get back JWT token
5. Store token in `auth.json` via `packages/opencode/src/auth/index.ts`

---

## QUICK REFERENCE: What calls what

```
Kilocode App (your machine)
│
├── Login clicked
│   └── POST your-server/api/device-auth/codes
│   └── GET  your-server/api/device-auth/codes/{code}  (polling)
│
├── After login
│   └── GET  your-server/api/profile
│   └── GET  your-server/api/profile/balance
│   └── GET  your-server/api/defaults
│
├── During usage
│   └── GET  your-server/api/notifications
│   └── POST your-server/api/fim/completions  (autocomplete)
│
├── Session sync
│   └── GET  your-server/api/trpc/cliSessionsV2.list
│   └── GET  your-server/api/cli-sessions/{id}/export
│
└── AI chat (goes DIRECTLY to Claude/GPT, NOT through your server)
    └── Anthropic API / OpenAI API (using user's API key)
```

**Important:** AI model calls do NOT go through your backend. They go directly to the AI providers. Your backend only handles user management, billing, and session sync.
