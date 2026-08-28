# 🗄️ Barangay Bagong Pag-asa E-Services (BrgyLink): Database Schema & ERD

<div align="center">

**Database Engine:** MongoDB Atlas (v7.0+) • **Object Data Modeling (ODM):** Mongoose (v8.0+) • **Storage Security:** AES-256

</div>

---

## 📊 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ SUBMISSION : submits
    USER ||--o{ BLOTTER_REPORT : files
    USER ||--o{ DOCUMENT_REQUEST : requests
    USER ||--o{ SUGGESTION : creates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : triggers
    MISSION ||--o{ SUBMISSION : targeted_by
    EVENT ||--o{ USER : rsvp_attendees
    ANNOUNCEMENT }o--|| USER : authored_by
    OFFICIAL }o--|| USER : linked_account

    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string password
        string fullName
        string phoneNumber
        string address
        string role "resident | official | admin"
        boolean mfaEnabled
        string mfaSecret
        date createdAt
        date updatedAt
    }

    MISSION {
        ObjectId _id PK
        string title
        string description
        number sdgNumber "e.g., 12, 13, 15"
        string sdgCategory
        string targetClass "e.g., tree, recycling"
        date deadline
        boolean isActive
    }

    SUBMISSION {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId missionId FK
        string missionTitle
        string imageUrl
        number latitude
        number longitude
        string aiVerdict "valid | invalid | flagged"
        number aiConfidence
        string perceptualHash
        string status "pending | approved | rejected"
        string adminFeedback
        string blockchainTxHash
        date createdAt
    }

    BLOTTER_REPORT {
        ObjectId _id PK
        ObjectId complainantId FK
        string incidentType
        string narrative
        string location
        string evidenceImageUrl
        boolean isAnonymous
        string status "pending | investigating | resolved"
        string resolutionSummary
        string presidingOfficer
        string blockchainTxHash
        number blockNumber
        date resolvedAt
        date createdAt
    }

    DOCUMENT_REQUEST {
        ObjectId _id PK
        ObjectId userId FK
        string documentType "Clearance | Indigency | Residency"
        string purpose
        string deliveryMode "Pick-up | Digital"
        string attachedValidIdUrl
        string status "pending | processing | ready | released"
        string trackingCode UK
        date processedAt
        date createdAt
    }

    ANNOUNCEMENT {
        ObjectId _id PK
        string title
        string content
        string category "Emergency | General | Event"
        string priority "normal | high | urgent"
        string bannerImageUrl
        boolean isPinned
        ObjectId authorId FK
        date createdAt
    }

    OFFICIAL {
        ObjectId _id PK
        string fullName
        string position "Punong Barangay | Kagawad | SK"
        string committee
        string photoUrl
        string contactEmail
        number displayOrder
        boolean isActive
    }

    SUGGESTION {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string category "Infrastructure | Sanitation | Safety"
        string description
        boolean isAnonymous
        string status "submitted | under_review | implemented"
        date createdAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipientId FK
        string title
        string message
        string type "BLOTTER | DOCUMENT | CIVIC | SYSTEM"
        boolean isRead
        date createdAt
    }

    AUDIT_LOG {
        ObjectId _id PK
        ObjectId userId FK
        string action "LOGIN | APPROVE | RESOLVE"
        string ipAddress
        string userAgent
        date timestamp
    }
```

---

## 📑 2. Data Dictionary

### 2.1 `User` Collection (`users`)
| Field Name | Type | Index | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `_id` | `ObjectId` | Primary Key | Yes | Auto | Unique MongoDB Identifier |
| `username` | `String` | Unique (`IXSCAN`) | Yes | None | Unique citizen handle |
| `email` | `String` | Unique (`IXSCAN`) | Yes | None | RFC 5322 email |
| `password` | `String` | No | Yes | None | Bcrypt hash (`saltRounds = 10`) |
| `fullName` | `String` | No | Yes | None | Official citizen name |
| `role` | `String` | Single (`IXSCAN`) | Yes | `'resident'` | Enum: `['resident', 'official', 'admin']` |
| `mfaEnabled` | `Boolean` | No | No | `true` | Enforces 6-digit email OTP |
| `createdAt` | `Date` | No | Yes | `Date.now` | Registration timestamp |

---

### 2.2 `Submission` Collection (`submissions`)
| Field Name | Type | Index | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `_id` | `ObjectId` | Primary Key | Yes | Auto | Unique Submission ID |
| `userId` | `ObjectId` | Compound Index | Yes | None | References `User._id` |
| `missionId` | `ObjectId` | Single (`IXSCAN`) | Yes | None | References `Mission._id` |
| `imageUrl` | `String` | No | Yes | None | Cloudinary CDN media link |
| `aiVerdict` | `String` | Single (`IXSCAN`) | No | `'pending'` | Enum: `['valid', 'invalid', 'flagged']` |
| `aiConfidence` | `Number` | No | No | `0.0` | Probability float ($0.0 \le x \le 1.0$) |
| `perceptualHash`| `String` | Single (`IXSCAN`) | No | None | 64-bit hexadecimal pHash |
| `status` | `String` | Compound Index | Yes | `'pending'` | Enum: `['pending', 'approved', 'rejected']` |

---

### 2.3 `BlotterReport` Collection (`blotters`)
| Field Name | Type | Index | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `_id` | `ObjectId` | Primary Key | Yes | Auto | Unique Blotter Record ID |
| `complainantId`| `ObjectId` | Single (`IXSCAN`) | Yes | None | References `User._id` |
| `incidentType` | `String` | No | Yes | None | Category of incident |
| `narrative` | `String` | Text Search | Yes | None | Detailed testimony statement |
| `status` | `String` | Compound Index | Yes | `'pending'` | Enum: `['pending', 'investigating', 'resolved']` |
| `blockchainTxHash`| `String`| Single (`IXSCAN`) | No | `null` | Cryptographic Sepolia anchor |
| `blockNumber` | `Number` | No | No | `null` | Block height where minted |
