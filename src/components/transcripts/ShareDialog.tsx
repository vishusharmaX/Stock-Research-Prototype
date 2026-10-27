"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ShieldCheck, Link2 } from "lucide-react";

interface ShareDialogProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ runId, isOpen, onClose }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/transcripts/${runId}/share`, { method: "POST" });
      const data = await res.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        setExpiresAt(data.expiresAt);
      }
    } catch (err) {
      console.error("Failed to generate share link:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <DialogTitle className="text-base font-semibold">
              Share Research Transcript
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Generate a cryptographically secure, time-limited read-only link to share this research run and execution transcript with an interviewer or peer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!shareUrl ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-600">
                Links are signed with HMAC-SHA256 tokens and expire automatically after 72 hours.
              </p>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isGenerating ? "Generating Secure Token..." : "Generate Shareable Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600">
                Read-Only Shareable URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded border border-border bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1 text-xs shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              {expiresAt && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  Token expires: {new Date(expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
