"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Eye, Printer, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useEditorStore } from '@/store';
import { fetchWithAuth } from '@/services/base-service';
import { useParams } from 'next/navigation';

const DownloadAsPDF = ({ children }) => {
  const { canvas } = useEditorStore();
  const params = useParams();
  const templateId = params?.template_id;
  const designId = params?.design_id;
  
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [settings, setSettings] = useState({
    format: 'a4',
    orientation: 'landscape',
    dpi: 300,
    bleed: 3,
    margin: 5,
    quality: 0.95,
    showCropMarks: true,
    embedFonts: true,
    convertToCurves: false
  });

  const formatOptions = [
    { value: 'a4', label: 'A4 (210×297mm)', width: 210, height: 297 },
    { value: 'a3', label: 'A3 (297×420mm)', width: 297, height: 420 },
    { value: 'letter', label: 'US Letter (216×279mm)', width: 216, height: 279 },
    { value: 'legal', label: 'US Legal (216×356mm)', width: 216, height: 356 }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generatePreview = (marginMm = 10) => {
    const canvas = document.getElementById("the_main_canvas");
    if (!canvas) {
      console.error("Canvas with ID " + "the_main_canvas" + " not found.");
      return;
    }

    const selectedFormat = formatOptions.find(ele => ele.value === settings.format);

    let pageWidth = (selectedFormat && selectedFormat.width) ? selectedFormat.width : 210;
    let pageHeight = (selectedFormat && selectedFormat.height) ? selectedFormat.height : 297;

    // Determine the orientation based on canvas dimensions
    const orientation = canvas.width > canvas.height ? 'l' : 'p';

    // If landscape, swap the A4 dimensions
    if (orientation === 'l') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    // Initialize jsPDF with the correct orientation
    const pdf = new jsPDF(orientation, 'mm', selectedFormat && selectedFormat.value ? selectedFormat.value : 'a4');

    // Calculate printable area
    const printableWidthMm = pageWidth - 2 * (settings.margin + settings.bleed);
    const printableHeightMm = pageHeight - 2 * (settings.margin + settings.bleed);

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate scaling factor to fit canvas onto the page while maintaining aspect ratio
    const scaleFactorWidth = printableWidthMm / canvasWidth;
    const scaleFactorHeight = printableHeightMm / canvasHeight;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

    // Calculate scaled dimensions and position
    const scaledWidth = canvasWidth * scaleFactor;
    const scaledHeight = canvasHeight * scaleFactor;
    const xPosition = (settings.margin + settings.bleed) + (printableWidthMm - scaledWidth) / 2;
    const yPosition = (settings.margin + settings.bleed) + (printableHeightMm - scaledHeight) / 2;

    // Add the canvas image to the PDF
    pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', xPosition, yPosition, scaledWidth, scaledHeight);

    // Generate the PDF data URL
    const url = pdf.output('datauristring');
    setPreviewUrl(url);
  };

  const handleQuickDownload = async () => {
    if (!previewUrl) {
      console.error("No PDF URL available to download.");
      return;
    }

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = 'design.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQualityDownload = async () => {
    if (!canvas) return;

    setIsExporting(true);
    try {
      const canvasData = canvas.toDataURL('image/png', 1.0);

      const response = await fetchWithAuth('/v1/designs/pdf', {
        method: 'POST',
        body: {
          // canvasData,
          designId,
          templateId,
          settings: {
            ...settings,
            fileName: 'design_print_ready'
          }
        },
        responseType: 'blob'
      });

      // Create blob from response data
      const url = window.URL.createObjectURL(response); // Use the response directly
      const link = document.createElement('a');
      link.href = url;
      link.download = `design_print_ready_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error('Print quality download failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (open && canvas) {
      generatePreview();
    }
  }, [open, canvas, settings]);



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="min-w-[98vw] sm:min-w-[90vw] lg:min-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export as PDF</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col  lg:flex-row gap-6">

          <div className="flex flex-wrap w-100 lg:w-96 gap-4">
            <div>
              <Label className={"pb-2"} htmlFor="margin">Margin (mm)</Label>
              <Input
                id="margin"
                type="number"
                value={settings.margin}
                onChange={(e) => handleSettingChange('margin', parseFloat(e.target.value) || 0)}
                min="0"
                max="50"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">White space around design</p>
            </div>

            <div>
              <Label className={"pb-2"} htmlFor="bleed">Bleed (mm)</Label>
              <Input
                id="bleed"
                type="number"
                value={settings.bleed}
                onChange={(e) => handleSettingChange('bleed', parseFloat(e.target.value) || 0)}
                min="0"
                max="10"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">Print safety area</p>
            </div>
            <div>
              <Label className={"pb-2"} htmlFor="format">Format</Label>
              <Select value={settings.format.toString()} onValueChange={(value) => handleSettingChange('format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {
                    formatOptions.map((ele) => {
                      return (
                        <SelectItem value={ele.value} >{ele.label}</SelectItem>
                      )
                    })
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={"pb-2"} htmlFor="dpi">Print Quality (DPI)</Label>
              <Select value={settings.dpi.toString()} onValueChange={(value) => handleSettingChange('dpi', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">150 DPI (Draft)</SelectItem>
                  <SelectItem value="300">300 DPI (Standard Print)</SelectItem>
                  <SelectItem value="600">600 DPI (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4 w-full">
            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <div className="relative bg-white">
                  {previewUrl ? (
                    <div className="w-full  rounded-xl  shadow-lg overflow-hidden">
                      <iframe
                        src={previewUrl}
                        className="w-full min-h-[450px]"
                        title="Generated PDF Preview"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-[800px] bg-gray-50 rounded-xl text-gray-500 text-lg">
                      Generating PDF...
                    </div>
                  )}
                </div>

                {/* <div className="text-center text-xs text-gray-500 mt-2">
                  <span className="inline-block w-3 h-3 bg-blue-200 border-2 border-blue-400 mr-1"></span>
                  Canvas Area
                  <span className="mx-2">|</span>
                  <span className="inline-block w-3 h-3 border-2 border-red-400 border-dashed mr-1"></span>
                  Bleed Area
                  <span className="mx-2">|</span>
                  <span className="inline-block w-3 h-3 border-2 border-green-400 border-dashed mr-1"></span>
                  Margin Area
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            onClick={handleQuickDownload}
            disabled={isExporting || !canvas}
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            Quick Download (Web)
          </Button>

          <Button
            onClick={handlePrintQualityDownload}
            disabled={isExporting || !canvas}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Print Quality Download
          </Button>

          <Button
            onClick={() => setOpen(false)}
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadAsPDF;