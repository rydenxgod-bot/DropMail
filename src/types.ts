export interface Domain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountCredentials {
  id: string;
  address: string;
  password: string;
  token: string;
  createdAt: string;
}

export interface EmailAddress {
  address: string;
  name: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  size: number;
  downloadUrl: string;
}

export interface MessageSummary {
  id: string;
  accountId: string;
  msgid: string;
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  intro?: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDetail {
  id: string;
  accountId: string;
  msgid: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  seen: boolean;
  flagged: boolean;
  isDeleted: boolean;
  retention: boolean;
  retentionDate: string;
  text?: string;
  html?: string[];
  hasAttachments: boolean;
  attachments: Attachment[];
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedCode {
  code: string;
  type: 'otp' | 'link';
  label?: string;
}
