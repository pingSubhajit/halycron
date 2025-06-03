export type SessionUser = {
	id: string
	name: string
	email: string
	emailVerified: boolean
	image?: string
	twoFactorEnabled: boolean
	createdAt: string
	updatedAt: string
}

export type Session = {
	user: SessionUser
	session: {
		id: string
		userId: string
		token: string
		expiresAt: string
		ipAddress?: string
		userAgent?: string
		createdAt: string
		updatedAt: string
	}
}
