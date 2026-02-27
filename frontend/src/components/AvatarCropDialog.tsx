import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Typography,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { useTranslation } from 'react-i18next';

const PREVIEW_SIZE = 280;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}

export const AvatarCropDialog: React.FC<AvatarCropDialogProps> = ({
  open,
  imageSrc,
  onClose,
  onApply,
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetState = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open && imageSrc) {
      resetState();
    }
  }, [open, imageSrc, resetState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const getCroppedImage = (): Promise<string> => {
    if (!imageSrc) return Promise.resolve('');
    const canvas = document.createElement('canvas');
    const size = PREVIEW_SIZE;
    const center = size / 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(imageSrc);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const imgW = img.width;
        const imgH = img.height;
        const scale = Math.min((size * zoom) / imgW, (size * zoom) / imgH);
        const scaledW = imgW * scale;
        const scaledH = imgH * scale;
        const drawX = center + position.x - scaledW / 2;
        const drawY = center + position.y - scaledH / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, center, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    });
  };

  const handleApply = useCallback(async () => {
    const cropped = await getCroppedImage();
    if (cropped) {
      onApply(cropped);
      onClose();
    }
  }, [imageSrc, zoom, position, onApply, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !imageSrc) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, imageSrc, onClose, handleApply]);

  return (
    <Dialog
      open={open && !!imageSrc}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>{t('adjustAvatar')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('avatarCropHint')}
        </Typography>

        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: PREVIEW_SIZE,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'grey.900',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Box
            sx={{
              position: 'relative',
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={imageSrc || ''}
              alt="Preview"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
                objectFit: 'contain',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, transparent ${PREVIEW_SIZE / 2}px, rgba(0,0,0,0.65) ${PREVIEW_SIZE / 2}px)`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.9)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ZoomOutIcon color="action" />
          <Slider
            value={Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            onChange={(_, v) => setZoom(Number(v))}
            sx={{ flex: 1 }}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(Number(v) * 100)}%`}
          />
          <ZoomInIcon color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48 }}>
            {Math.round(zoom * 100)}%
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={resetState}>{t('reset')}</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={handleApply}>
          {t('apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
