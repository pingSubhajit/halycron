import {Photo} from '../photos/types'
import {Album} from '../albums/types'

export type ExpiryOption = '5min' | '15min' | '30min' | '1h' | '8h' | '24h' | '3d' | '7d' | '30d';

export type ShareType = 'photo' | 'album';

export type SharedLink = {
  id: string;
  token: string;
  isPinProtected: boolean;
  expiresAt: Date;
  createdAt: Date;
  photos?: Photo[];
  albums?: Album[];
};

export type CreateShareLinkRequest = {
  photoIds?: string[];
  albumIds?: string[];
  expiryOption: ExpiryOption;
  pin?: string;
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
};

export type GetSharedItemsRequest = {
  token: string;
};

export type GetSharedItemsResponse = {
  shareType: ShareType;
  photos?: Photo[];
  albums?: Album[];
  isPinProtected: boolean;
  expiresAt: Date;
};
