import { useState } from 'react'
import { Button } from '@halycon/ui/components/button'
import { Input } from '@halycon/ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@halycon/ui/components/card'
import { useQueryState } from 'nuqs'

export function TwoFactorVerify({ onVerify, onCancel }: { onVerify: (code: string) => Promise<void>, onCancel: () => void }) {
  const [code, setCode] = useQueryState('code', { defaultValue: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    try {
      setIsLoading(true)
      setError('')
      await onVerify(code)
    } catch (err) {
      setError('Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleVerify} 
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              Verify
            </Button>
            <Button 
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 