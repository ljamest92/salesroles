import React, { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, toast } from '@blinkdotnew/ui'
import { ShieldAlert, CheckCircle, ChevronDown } from 'lucide-react'
import { blink } from '../lib/blink'

interface ReportModalProps {
  jobId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportModal({ jobId, isOpen, onOpenChange }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const reasons = [
    { value: 'fake', label: 'Fake listing' },
    { value: 'misleading', label: 'Misleading compensation' },
    { value: 'discriminatory', label: 'Discriminatory content' },
    { value: 'spam', label: 'Spam or scam' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setIsSubmitting(true)
    try {
      await blink.db.reportedListings.create({
        jobId,
        reason,
        status: 'open'
      })
      setIsSuccess(true)

      setTimeout(() => {
        onOpenChange(false)
        setIsSuccess(false)
        setReason('')
      }, 2500)
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report', { description: 'Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border border-white/5 p-0 overflow-hidden rounded-[32px] max-w-lg">
        {isSuccess ? (
          <div className="p-12 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto">
              <CheckCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter">Report Received</h3>
              <p className="text-muted-foreground font-medium">Thank you for helping us maintain the quality of SalesRoles.co. Our team will investigate this listing within 24 hours.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <DialogHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black tracking-tighter">Report Listing</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Please let us know why you are reporting this job.</DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50">Reason for Report</label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a reason...</option>
                  {reasons.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <DialogFooter className="flex gap-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 font-bold text-[10px] h-12">Cancel</Button>
              <Button type="submit" disabled={!reason || isSubmitting} className="flex-1 bg-primary text-primary-foreground font-black text-[10px] h-12 cta-glow">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
