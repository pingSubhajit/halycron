import VerifyEmailClient from '@/app/(site)/verify-email/verify-email-client'
import {Suspense} from 'react'

const VerifyEmailPage = () => {
	return <>
		<Suspense>
			<VerifyEmailClient/>
		</Suspense>
	</>
}

export default VerifyEmailPage
