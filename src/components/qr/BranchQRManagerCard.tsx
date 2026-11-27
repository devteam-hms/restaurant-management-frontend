import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Store,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';
import { fetchBranches } from '@/store/slices/branchSlice';
import { branchService } from '@/services/branch.service';
import { BranchQRDetails } from '@/types/branch';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

export const BranchQRManagerCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: restaurants } = useAppSelector((state) => state.restaurants);
  const { items: branches } = useAppSelector((state) => state.branches);
  const { success, error: toastError } = useToast();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [qrDetails, setQrDetails] = useState<BranchQRDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize restaurants and branches
  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchBranches({ limit: 100 }));
  }, [dispatch]);

  // Set default restaurant when loaded
  useEffect(() => {
    if (!selectedRestaurantId && restaurants.length > 0) {
      setSelectedRestaurantId(restaurants[0].restaurant_id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Filter branches by selected restaurant
  const filteredBranches = branches.filter(
    (b) => !selectedRestaurantId || b.restaurant_id === selectedRestaurantId
  );

  // Set default branch when restaurant changes
  useEffect(() => {
    if (filteredBranches.length > 0) {
      const match = filteredBranches.find((b) => b.branch_id === selectedBranchId);
      if (!match) {
        setSelectedBranchId(filteredBranches[0].branch_id);
      }
    } else {
      setSelectedBranchId('');
      setQrDetails(null);
    }
  }, [selectedRestaurantId, filteredBranches, selectedBranchId]);

  // Load QR details whenever branch changes
  useEffect(() => {
    if (!selectedBranchId) {
      setQrDetails(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    branchService
      .getBranchQR(selectedBranchId)
      .then((res) => {
        if (isMounted) {
          setQrDetails(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch branch QR code details:', err);
        if (isMounted) {
          setQrDetails(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  const selectedRestaurant = restaurants.find(
    (r) => r.restaurant_id === selectedRestaurantId
  );
  const selectedBranch = branches.find(
    (b) => b.branch_id === selectedBranchId
  );

  const handleGenerate = async (regenerate: boolean = false) => {
    if (!selectedBranchId) return;

    setIsGenerating(true);
    try {
      const res = await branchService.generateBranchQR(selectedBranchId, regenerate);
      setQrDetails(res.data);
      success(
        regenerate
          ? 'New QR code generated successfully.'
          : 'Branch QR code ready.'
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to generate branch QR code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedBranchId || !selectedBranch) return;

    setIsDownloading(true);
    try {
      await branchService.downloadBranchQR(
        selectedBranchId,
        selectedBranch.branch_name || 'branch'
      );
      success('QR Code image downloaded successfully.');
    } catch (err: any) {
      toastError(err.message || 'Failed to download QR code image.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!qrDetails?.menu_url) return;
    navigator.clipboard.writeText(qrDetails.menu_url);
    setCopied(true);
    success('Digital menu URL copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = qrDetails?.qr_preview_url || (selectedBranchId
    ? branchService.getBranchQRImageUrl(selectedBranchId)
    : '');

  const isQrActive = Boolean(qrDetails?.public_menu_code);

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-luxury relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <QrCode className="w-5 h-5" />
              </span>
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Branch Digital Menu & QR Code Generation
              </h3>
            </div>
            <p className="text-xs text-muted max-w-2xl font-light">
              One unique QR code for each restaurant branch. The same QR code is placed on all tables inside that branch.
            </p>
          </div>

          {/* Quick Notice Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary border border-border text-xs text-muted">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Branch-Wise Centralized QR</span>
          </div>
        </div>

        {/* Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Restaurant Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>Select Restaurant</span>
            </label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              {restaurants.length === 0 ? (
                <option value="">No restaurants available</option>
              ) : (
                restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.restaurant_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Branch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Select Branch</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={filteredBranches.length === 0}
              className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
            >
              {filteredBranches.length === 0 ? (
                <option value="">No branches under this restaurant</option>
              ) : (
                filteredBranches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name} {b.city ? `(${b.city})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Branch Status & Action Card */}
        {selectedBranch ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 rounded-xl bg-surface-secondary/50 border border-border/80">
            {/* Left Column: Branch Details & Action Buttons */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-muted uppercase tracking-wider">Restaurant Branch</div>
                <div className="font-serif text-xl font-medium text-foreground">
                  {selectedRestaurant?.restaurant_name || 'Restaurant'} — {selectedBranch.branch_name}
                </div>
                <p className="text-xs text-muted">
                  {selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted font-medium">QR Code Status:</span>
                {isLoadingDetails ? (
                  <span className="text-xs text-muted animate-pulse">Checking status...</span>
                ) : isQrActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Not Generated
                  </span>
                )}
              </div>

              {/* Informative Table Message Requirement */}
              <div className="p-3.5 rounded-lg bg-surface border border-border text-xs text-muted font-light leading-relaxed">
                <p className="m-0 italic">
                  "This QR code can be placed on all tables in this restaurant branch. Customers scanning it will automatically access this branch's digital menu."
                </p>
              </div>

              {/* URL Display (when active) */}
              {isQrActive && qrDetails?.menu_url && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
                    Customer Digital Menu URL
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qrDetails.menu_url}
                      className="flex-1 h-9 px-3 text-xs font-mono rounded-lg border border-border bg-surface text-foreground select-all"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      title="Copy URL"
                      className="h-9 px-3 gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <a
                      href={qrDetails.menu_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-secondary text-xs gap-1 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isQrActive ? (
                  <Button
                    variant="primary"
                    onClick={() => handleGenerate(false)}
                    isLoading={isGenerating}
                    className="gap-2 shadow-gold-glow"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR Code</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={handleDownload}
                      isLoading={isDownloading}
                      className="gap-2 shadow-gold-glow"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Code</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate(true)}
                      isLoading={isGenerating}
                      title="Regenerate with a new unpredictable public menu code"
                      className="gap-1.5 text-xs text-muted hover:text-foreground"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate QR</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: QR Code Visual Preview Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-border text-center">
              {isQrActive ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl shadow-md inline-block border border-gray-100">
                    <img
                      src={qrImageUrl}
                      alt={`QR Code for ${selectedBranch.branch_name}`}
                      className="w-44 h-44 object-contain rounded"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {selectedBranch.branch_name} Branch QR
                    </div>
                    <div className="text-[11px] font-mono text-muted">
                      Code: {qrDetails?.public_menu_code}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-muted">
                    <QrCode className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-foreground">No QR Code Generated Yet</h5>
                    <p className="text-xs text-muted max-w-xs font-light">
                      Click "Generate QR Code" to create the branch's unique digital restaurant menu link.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-surface-secondary/40 border border-border text-muted text-xs font-light">
            Please register or select a branch above to manage its table QR codes.
          </div>
        )}
      </div>
    </div>
  );
};
