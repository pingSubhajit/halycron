# API Endpoints

Halyon is a service that will let me and other users have a private photo vault that would be stored in my S3 or if someone wants to store in their own S3 bucket that will be possible as well. UI functionality wise it would be much like Google photos but would be highly security focused. So much so that it has to be near impossible to unwanted people to get hold of the photos even when they are loaded in the UI. The service will have a companion mobile app and a web app that will let users upload, batch upload, tag, organize, view, delete, download and manage their photos.

### 1 Authentication Endpoints

#### POST /api/auth/register

Creates a new user account

```ts
Request:
{
    email: string,
    password: string
}

Response:
{
    userId: string,
    email: string,
    mfaRequired: boolean,
    mfaSetupToken?: string
}
```

#### POST /api/auth/login

Authenticates a user

```ts
Request:
{
    email: string,
    password: string,
    mfaCode?: string
}

Response:
{
    accessToken: string,
    refreshToken: string,
    user: {
        id: string,
        email: string
    }
}
```


### 2 Photo Management Endpoints

#### POST /api/photos/upload

Uploads a new photo

```ts
Request: MultipartFormData {
    file: File,
    encryptedKey: string,
    keyIv: string,
    metadata?: {
        tags?: string[],
        albumId?: string
    }
}

Response:
{
    id: string,
    fileName: string,
    size: number,
    createdAt: string
}
```

#### GET /api/photos

Retrieves user's photos with pagination

```ts
Request: QueryParams {
    page?: number,
    limit?: number,
    tagIds?: string[],
    albumId?: string
}

Response:
{
    photos: [{
        id: string,
        thumbnailUrl: string,
        metadata: object,
        createdAt: string
    }],
    totalCount: number,
    pageCount: number
}
```

#### GET /api/photos/:id

Retrieves a single photo

```ts
Response:
{
    id: string,
    encryptedKey: string,
    keyIv: string,
    downloadUrl: string,
    metadata: object,
    tags: string[],
    albums: string[]
}
```


### 3 Album Management Endpoints

#### POST /api/albums

Creates a new album

```ts
Request:
{
    name: string,
    isSensitive: boolean,
    isProtected: boolean,
    pin?: string,    // 4-digit PIN code (required if isProtected is true)
    photoIds?: string[]
}

Response:
{
    id: string,
    name: string,
    isSensitive: boolean,
    isProtected: boolean,
    photoCount: number,
    createdAt: string
}
```

#### PUT /api/albums/:id

Updates an album

```ts
Request:
{
    name?: string,
    isSensitive?: boolean,
    isProtected?: boolean,
    pin?: string     // 4-digit PIN code (required when enabling protection)
}

Response:
{
    id: string,
    name: string,
    isSensitive: boolean,
    isProtected: boolean,
    updatedAt: string
}
```

#### POST /api/albums/:id/verify-pin

Verifies PIN for a protected album

```ts
Request:
{
    pin: string      // 4-digit PIN code
}

Response:
{
    verified: boolean,
    accessToken: string,  // Token to use for subsequent requests to this album
    expiresAt: string     // When the verification expires
}
```

#### PUT /api/albums/:id/photos

```ts
Request:
{
    photoIds: string[],
    positions: number[]
}

Response:
{
    updated: boolean,
    photoCount: number
}
```


### 4 Tag Management Endpoints

#### POST /api/tags

Creates a new tag

```ts
Request:
{
    name: string
}

Response:
{
    id: string,
    name: string
}
```

#### POST /api/photos/:id/tags

Adds tags to a photo

```ts
Request:
{
    tagIds: string[]
}

Response:
{
    success: boolean,
    tags: [{
        id: string,
        name: string
    }]
}
```

### 5 Security Endpoints

#### POST /api/auth/mfa/enable

Enables MFA for a user

```ts
Request:
{
    mfaCode: string,
    backupCodes: string[]
}

Response:
{
    enabled: boolean,
    backupCodes: string[]
}
```

#### POST /api/auth/password/change

Changes user's password

```ts
Request:
{
    currentPassword: string,
    newPassword: string,
    mfaCode: string
}

Response:
{
    success: boolean,
    requiresRelogin: boolean
}
```

All endpoints except /auth/login and /auth/register require:

- Authorization header with valid JWT
- Content-Type header
- Accept header