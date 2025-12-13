import {Album} from '../albums/types'

export type ExpiryOption = '5min' | '15min' | '30min' | '1h' | '8h' | '24h' | '3d' | '7d' | '30d';

export type ShareType = 'photo' | 'album';

export type SharedLink = {
  id: string;
  token: string;
  isPinProtected: boolean;
  expiresAt: Date;
  createdAt: Date;
  photos?: SharedPhoto[];
  albums?: Album[];
};

export type CreateShareLinkRequest = {
  photoIds?: string[];
  albumIds?: string[];
  expiryOption: ExpiryOption;
  pin?: string;

  /**
   * v1 (E2EE) share payload: client-provided per-photo wrapped DEK + encrypted filename.
   * Server never receives the Share Key (SK) for non-PIN shares (it lives in the URL fragment).
   */
  sharePhotos?: Array<{
    photoId: string;
    wrappedDekForShare: string;
    wrappedDekForShareIv: string;
    encryptedFilenameForShare: string;
    filenameForShareIv: string;
  }>;

  /**
   * PIN shares only: SK encrypted under a PIN-derived key + KDF params.
   */
  pinWrappedShareKey?: {
    skWrappedByPin: string;
    pinKdfSalt: string;
    pinKdfParams: string;
    skWrapIv: string;
  };
};

export type CreateShareLinkResponse = {
  shareLink: SharedLink;
  shareUrl: string;
};

export type VerifyPinRequest = {
  token: string;
  pin: string;
};

export type VerifyPinResponse = {
  isValid: boolean;
  cookie?: {
    name: string;
    value: string;
  };
};

export type GetSharedItemsRequest = {
  token: string;
};

export type GetSharedItemsResponse = {
  shareType: ShareType;
  photos?: SharedPhoto[];
  albums?: (Album & { photos?: SharedPhoto[] })[];
  isPinProtected: boolean;
  expiresAt: Date;
  requiresPin?: boolean;
  pinKeyMaterial?: {
    skWrappedByPin: string;
    pinKdfSalt: string;
    pinKdfParams: string;
    skWrapIv: string;
  } | null;
};

export type SharedPhoto = {
  id: string;
  url: string;
  s3Key: string;
  mimeType: string;
  imageWidth: number | null;
  imageHeight: number | null;
  createdAt: Date | null;

  // Normalized IV for decrypting photo bytes (hex)
  contentIv: string;

  // Share-specific key material (wrapped under Share Key (SK))
  wrappedDekForShare: string | null;
  wrappedDekForShareIv: string | null;
  encryptedFilenameForShare: string | null;
  filenameForShareIv: string | null;
};
