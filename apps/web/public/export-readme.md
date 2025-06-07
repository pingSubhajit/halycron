# Halycron Data Export

Welcome to your Halycron data export! This package contains all your photos, albums, and metadata in an encrypted
format.

## 📁 Export Structure

```
export-{timestamp}/
├── photos/                     # Encrypted photo files
│   ├── {photo-id}.encrypted   # Your encrypted photos
│   └── ...
├── metadata/                   # Readable metadata files
│   ├── photos.json            # Photo metadata and EXIF data
│   ├── albums.json            # Album structure and relationships
│   ├── shared-links.json      # Shared links information
│   └── settings.json          # Your app settings
├── keys/                       # Encryption keys (encrypted)
│   └── decryption-keys.json   # Photo decryption keys
├── tools/                      # Decryption utilities
│   ├── decrypt.html           # Web-based decryption tool
│   └── README.md              # This file
└── manifest.json              # Export summary and verification
```

## 🔐 Security & Encryption

- **Your photos remain encrypted** in this export for maximum security
- Each photo was encrypted with a unique AES-256-GCM key
- Photo encryption keys are themselves encrypted with your master key
- **Zero-knowledge**: Halycron cannot decrypt your photos without your master password

## 🛠️ How to Decrypt Your Photos

### Option 1: Web-based Tool (Recommended)

1. Open `tools/decrypt.html` in any modern web browser
2. Follow the step-by-step instructions in the tool
3. You'll need your **master password** (the one you use to log into Halycron)

### Option 2: Command Line (Advanced Users)

If you're comfortable with programming, you can implement your own decryption using the provided metadata:

```javascript
// Pseudo-code for decryption process
1.
Read
decryption - keys.json
2.
Derive
master
key
from
your
password
using PBKDF2
3.
Decrypt
each
photo
's file key using the master key
4.
Decrypt
each
photo
using its
file
key
with AES - 256 - GCM
```

## 📊 Metadata Files

### photos.json

Contains information about each photo:

- Original filename and creation date
- Image dimensions and MIME type
- Album associations
- EXIF metadata (if available)

### albums.json

Contains your album structure:

- Album names and creation dates
- Privacy settings (sensitive/protected status)
- Photo relationships

### shared-links.json

Contains information about any shared links you've created:

- Share tokens and expiration dates
- Associated photos and albums
- Privacy settings

## ⚠️ Important Notes

1. **Keep this export secure** - it contains your encrypted photos and keys
2. **Remember your master password** - without it, the photos cannot be decrypted
3. **This export expires** - download links are time-limited for security
4. **Backup recommended** - save this export to multiple secure locations

## 🆘 Need Help?

If you encounter any issues:

1. **Check your master password** - this is the most common issue
2. **Verify file integrity** - ensure all files downloaded completely
3. **Use a modern browser** - the web tool requires modern JavaScript features
4. **Contact support** - reach out to support@halycron.com if you need assistance

## 🔍 Export Verification

This export was generated on: {generatedAt}
Total photos: {totalPhotos}
Total albums: {totalAlbums}
Export version: {version}

---

**Halycron - Your Photos, Your Privacy, Your Control**

For more information, visit: https://halycron.com 