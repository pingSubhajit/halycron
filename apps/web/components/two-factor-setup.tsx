import { useState } from 'react'
import { Button } from '@halycon/ui/components/button'
import { Input } from '@halycon/ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@halycon/ui/components/card'
import Image from 'next/image'
import { authClient } from '@/lib/auth/auth-client'
import QRCode from 'qrcode'
import { useQueryState } from 'nuqs'

export function TwoFactorSetup({ onComplete }: { onComplete: () => void }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'password' | 'qr' | 'verify'>('password')

  const initiate2FA = async () => {
    try {
      setIsLoading(true)
      const response = await authClient.twoFactor.enable({
        password
      })

      if (!response.data) {
        throw new Error('Failed to initialize 2FA setup')
      }

      const { totpURI, backupCodes } = await response.data
      
      // Generate QR code from totpURI
      const qrCode = await QRCode.toDataURL(totpURI)
      setQrCodeDataUrl(qrCode)
      setBackupCodes(backupCodes)
      setStep('qr')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize 2FA setup')
    } finally {
      setIsLoading(false)
    }
  }

  const verify2FA = async () => {
    try {
      setIsLoading(true)
      const response = await authClient.twoFactor.verifyTotp({
        code: verificationCode
      })
      console.log(response, "===========================")

      if (response.error) {
        throw new Error('Invalid verification code')
      }

      onComplete()
    } catch (err) {
      setError('Invalid verification code')
      setVerificationCode('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'password' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please enter your password to begin 2FA setup
            </p>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button 
              onClick={initiate2FA} 
              disabled={isLoading || !password}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                1. Install an authenticator app like Google Authenticator or Authy
              </p>
              <p className="text-sm text-gray-500">
                2. Scan this QR code with your authenticator app
              </p>
              <div className="flex justify-center">
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="border p-2 rounded"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Backup Codes</p>
              <p className="text-sm text-gray-500">
                Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="bg-dark border border-zinc-800 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-sm font-mono">{code}</code>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep('verify')} 
              className="w-full"
            >
              Continue to Verification
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter the verification code from your authenticator app
            </p>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button 
              onClick={verify2FA} 
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              Verify and Enable 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 