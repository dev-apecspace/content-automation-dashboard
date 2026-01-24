"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Move, Check, X, AlertCircle, Grid3x3, ArrowLeftRight, ArrowUpDown } from "lucide-react";

import { WatermarkSettings } from "@/lib/services/watermark-service";

interface WatermarkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  logoUrl: string;
  onApply: (newUrl: string) => void; // Keep for backward compat or immediate preview if needed
  onApplySettings?: (settings: WatermarkSettings) => void;
  initialSettings?: WatermarkSettings;
}

export function WatermarkEditor({
  isOpen,
  onClose,
  imageUrl,
  logoUrl,
  onApply,
  onApplySettings,
  initialSettings,
}: WatermarkEditorProps) {
  // State for Logo Position (pixels relative to displayed image)
  const [position, setPosition] = useState({ x: 20, y: 20 });
  
  // State for Logo Size (percentage of image width, e.g., 20 = 20%)
  const [size, setSize] = useState([13]); // slider expects array
  
  // State for Opacity (0-100)
  const [opacity, setOpacity] = useState([100]);
  
  // State for Grid
  const [showGrid, setShowGrid] = useState(false);

  // Refs for tracking drag
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Reset when opening new image
  useEffect(() => {
    if (isOpen) {
      if (initialSettings) {
         // Apply initial settings if available. 
         setSize([initialSettings.widthPercent]);
         setOpacity([initialSettings.opacity]);
      } else {
        setPosition({ x: 20, y: 20 }); // Default some offset
        setSize([13]);
        setOpacity([100]);
      }
    }
  }, [isOpen, imageUrl, initialSettings]);

  // Helper: Handle Drag Start
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Calculate offset: mouse position relative to element top-left
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Helper: Handle Drag Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // New Position relative to container
    let newX = e.clientX - containerRect.left - dragOffset.current.x;
    let newY = e.clientY - containerRect.top - dragOffset.current.y;

    setPosition({ x: newX, y: newY });
  };

  // Helper: Handle Drag End
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Helper: Handle Center
  const handleCenter = (axis: 'x' | 'y') => {
    if (!containerRef.current || !logoRef.current) return;

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    
    const logoW = logoRef.current.offsetWidth;
    const logoH = logoRef.current.offsetHeight;

    if (axis === 'x') {
      setPosition(prev => ({ ...prev, x: (containerW - logoW) / 2 }));
    } else {
      setPosition(prev => ({ ...prev, y: (containerH - logoH) / 2 }));
    }
  };

  // Logic: Calculate Settings and Apply
  const handleApply = () => {
    if (!imageRef.current || !containerRef.current) return;

    // Get Container Dimensions (Display)
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate Percentages
    // Clamp values to 0-100 range roughly
    const xPercent = Math.max(0, Math.min(100, (position.x / containerWidth) * 100));
    const yPercent = Math.max(0, Math.min(100, (position.y / containerHeight) * 100));
    
    const settings: WatermarkSettings = {
      xPercent,
      yPercent,
      widthPercent: size[0],
      opacity: opacity[0]
    };

    if (onApplySettings) {
      onApplySettings(settings);
    }
    if (onApply) {
        onApply(imageUrl); // No-op essentially, parent manages change via settings 
    }
    
    onClose();
  };




  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 dark border-neutral-800 bg-neutral-900 text-neutral-50">
        <DialogHeader className="px-6 py-4 border-b border-neutral-800">
          <DialogTitle className="flex items-center gap-2">
            Chèn Watermark / Logo
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas Area */}
          <div className="flex-1 bg-neutral-950 flex items-center justify-center p-8 overflow-auto relative">
             <div 
               ref={containerRef}
               className="relative shadow-2xl inline-block overflow-hidden bg-black/5" 
               style={{ maxWidth: '100%', maxHeight: '100%' }}
             >
               <img 
                 ref={imageRef}
                 src={imageUrl} 
                 alt="Base" 
                 className="max-w-full max-h-[70vh] block object-contain"
                 draggable={false}
               />
               
               {/* Grid Overlay */}
               {showGrid && (
                 <div className="absolute inset-0 pointer-events-none z-0">
                    {/* Simple 3x3 Grid */}
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 border-b border-blue-500/50 flex">
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1"></div>
                      </div>
                      <div className="flex-1 border-b border-blue-500/50 flex">
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1"></div>
                      </div>
                      <div className="flex-1 flex">
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1 border-r border-blue-500/50"></div>
                          <div className="flex-1"></div>
                      </div>
                    </div>
                 </div>
               )}
               
               {/* Logo Overlay */}
               <div
                 ref={logoRef}
                 className="absolute cursor-move select-none group border-2 border-transparent hover:border-blue-500/50 rounded z-10"
                 style={{
                   left: position.x,
                   top: position.y,
                   width: `${size[0]}%`,
                   opacity: opacity[0] / 100,
                   touchAction: "none"
                 }}
                 onPointerDown={handlePointerDown}
                 onPointerMove={handlePointerMove}
                 onPointerUp={handlePointerUp}
               >
                 <img 
                   src={logoUrl} 
                   alt="Logo" 
                   className="w-full h-auto pointer-events-none" 
                   draggable={false}
                 />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                    <Move className="w-6 h-6 text-white drop-shadow-md" />
                 </div>
               </div>
             </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
            
            {/* Tools */}
            <div className="space-y-4">
               <div className="flex gap-2">
                  <Button 
                    variant={showGrid ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    className="flex-1 gap-2 border border-neutral-700 hover:bg-neutral-800"
                    title="Bật/Tắt Lưới"
                  >
                    <Grid3x3 className="w-4 h-4" /> Lưới
                  </Button>
               </div>
               <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCenter('x')}
                    className="flex-1 gap-2 border border-neutral-700 hover:bg-neutral-800"
                    title="Căn giữa ngang"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> Giữa Ngang
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCenter('y')}
                    className="flex-1 gap-2 border border-neutral-700 hover:bg-neutral-800"
                    title="Căn giữa dọc"
                  >
                    <ArrowUpDown className="w-4 h-4" /> Giữa Dọc
                  </Button>
               </div>
            </div>

            {/* Size Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-300">Kích thước</Label>
                <span className="text-sm text-neutral-400 font-medium">{size[0]}%</span>
              </div>
              <Slider 
                value={size} 
                max={100} 
                min={5} 
                step={1} 
                onValueChange={setSize}
                className="py-2"
              />
            </div>

             {/* Opacity Control */}
             <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-300">Độ mờ (Opacity)</Label>
                <span className="text-sm text-neutral-400 font-medium">{opacity[0]}%</span>
              </div>
              <Slider 
                value={opacity} 
                max={100} 
                min={10} 
                step={1} 
                onValueChange={setOpacity}
                className="py-2"
              />
            </div>
            
            <div className="mt-auto space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-xs text-amber-200/90 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Lưu ý: Một khi đã áp dụng, ảnh sẽ được lưu lại cùng với logo. Nếu muốn chỉnh sửa vị trí/kích thước, bạn sẽ cần tải lại ảnh mới.
                </span>
              </div>
              <Button 
                onClick={handleApply} 
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check className="w-4 h-4" /> Áp dụng
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="w-full gap-2 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700"
              >
                <X className="w-4 h-4" /> Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
