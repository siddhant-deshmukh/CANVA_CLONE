import { useEditorStore } from '@/store';
import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fontFamilies } from "@/config";
import { Button } from '../ui/button';
import { Bold, Italic, MoveDown, MoveUp, Underline } from 'lucide-react';
import { Slider } from '../ui/slider';

const EditPropertiesInlineEditor = () => {
  const { canvas, markAsModified } = useEditorStore();
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });

  const [selectedObject, setSelectedObject] = useState(null);
  const [objectType, setObjectType] = useState("");

  //common
  const [opacity, setOpacity] = useState(100);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  //text
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [underline, setUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textBackgroundColor, setTextBackgroundColor] = useState("");
  const [letterSpacing, setLetterSpacing] = useState(0);

  const [fillColor, setFillColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderStyle, setBorderStyle] = useState("solid");

  const [filter, setFilter] = useState("none");
  const [blur, setBlur] = useState(0);


  const updateObjectProperty = (property, value) => {
    if (!canvas || !selectedObject) return;

    selectedObject.set(property, value);
    canvas.renderAll();
    markAsModified();
  };

  //opacity
  const handleOpacityChange = (value) => {
    const newValue = Number(value[0]);
    setOpacity(newValue);
    updateObjectProperty("opacity", newValue / 100);
  };

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);
    updateObjectProperty("text", newText);
  };

  const handleBringToFront = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringObjectToFront(selectedObject);
    canvas.renderAll();
    markAsModified();
  };

  const handleSendToBack = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendObjectToBack(selectedObject);
    canvas.renderAll();
    markAsModified();
  };


  const handleFontSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setFontSize(newSize);
    updateObjectProperty("fontSize", newSize);
  };

  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    updateObjectProperty("fontFamily", value);
  };

  const handleToggleBold = () => {
    const newWeight = fontWeight === "bold" ? "normal" : "bold";
    setFontWeight(newWeight);
    updateObjectProperty("fontWeight", newWeight);
  };

  const handleToggleItalic = () => {
    const newStyle = fontStyle === "italic" ? "normal" : "italic";
    setFontStyle(newStyle);
    updateObjectProperty("fontStyle", newStyle);
  };

  const handleToggleUnderline = () => {
    const newUnderline = !underline;
    setUnderline(newUnderline);
    updateObjectProperty("underline", newUnderline);
  };

  const handleToggleTextColorChange = (e) => {
    const newTextColor = e.target.value;
    setTextColor(newTextColor);
    updateObjectProperty("fill", newTextColor);
  };

  const handleToggleTextBackgroundColorChange = (e) => {
    const newTextBgColor = e.target.value;
    setTextBackgroundColor(newTextBgColor);
    updateObjectProperty("backgroundColor", newTextBgColor);
  };

  const handleLetterSpacingChange = (value) => {
    const newSpacing = value[0];
    setLetterSpacing(newSpacing);
    updateObjectProperty("charSpacing", newSpacing);
  };

  const handleFillColorChange = (event) => {
    const newFillColor = event.target.value;
    setFillColor(newFillColor);
    updateObjectProperty("fill", newFillColor);
  };

  const handleBorderColorChange = (event) => {
    const newBorderColor = event.target.value;
    setBorderColor(newBorderColor);
    updateObjectProperty("stroke", newBorderColor);
  };

  const handleBorderWidthChange = (value) => {
    const newBorderWidth = value[0];
    setBorderWidth(newBorderWidth);
    updateObjectProperty("strokeWidth", newBorderWidth);
  };

  const handleBorderStyleChange = (value) => {
    setBorderStyle(value);

    let strokeDashArray = null;

    if (value === "dashed") {
      strokeDashArray = [5, 5];
    } else if (value === "dotted") {
      strokeDashArray = [2, 2];
    }

    updateObjectProperty("strokeDashArray", strokeDashArray);
  };

  const handleImageFilterChange = async (value) => {
    setFilter(value);

    if (!canvas || !selectedObject || selectedObject.type !== "image") return;
    try {
      canvas.discardActiveObject();

      const { filters } = await import("fabric");

      selectedObject.filters = [];

      switch (value) {
        case "grayscale":
          selectedObject.filters.push(new filters.Grayscale());

          break;
        case "sepia":
          selectedObject.filters.push(new filters.Sepia());

          break;
        case "invert":
          selectedObject.filters.push(new filters.Invert());

          break;
        case "blur":
          selectedObject.filters.push(new filters.Blur({ blur: blur / 100 }));

          break;
        case "none":
        default:
          break;
      }

      selectedObject.applyFilters();

      canvas.setActiveObject(selectedObject);
      canvas.renderAll();
      markAsModified();
    } catch (e) {
      console.error("Failed to apply filters");
    }
  };

  const handleBlurChange = async (value) => {
    const newBlurValue = value[0];
    setBlur(newBlurValue);

    if (
      !canvas ||
      !selectedObject ||
      selectedObject.type !== "image" ||
      filter !== "blur"
    )
      return;

    try {
      const { filters } = await import("fabric");

      selectedObject.filters = [new filters.Blur({ blur: newBlurValue / 100 })];
      selectedObject.applyFilters();
      canvas.renderAll();
      markAsModified();
    } catch (error) {
      console.error("Error while applying blur !", e);
    }
  };



  const updatePosition = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      // Get object's bounding rect
      const boundingRect = activeObject.getBoundingRect();

      // Get canvas offset position
      const canvasElement = canvas.getElement();
      const canvasRect = canvasElement.getBoundingClientRect();

      // Calculate position for top-right corner, above the object
      const x = canvasRect.left + boundingRect.left + boundingRect.width;
      const y = canvasRect.top + boundingRect.top - 90; // 110 to account for div height + margin

      setPosition({
        x: Math.max(0, x),
        y: Math.max(0, y),
        visible: true
      });
    } else {
      setPosition(prev => ({ ...prev, visible: false }));
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      updatePosition();

      const activeObject = canvas.getActiveObject();

      if (activeObject) {

        setSelectedObject(activeObject);
        //update common properties
        setOpacity(Math.round(activeObject.opacity * 100) || 100);
        setWidth(Math.round(activeObject.width * activeObject.scaleX));
        setHeight(Math.round(activeObject.height * activeObject.scaleY));


        //check based on type
        if (activeObject.type === "i-text") {
          setObjectType("text");

          setText(activeObject.text || "");
          setFontSize(activeObject.fontSize || 24);
          setFontFamily(activeObject.fontFamily || "Arial");
          setFontWeight(activeObject.fontWeight || "normal");
          setFontStyle(activeObject.fontStyle || "normal");
          setUnderline(activeObject.underline || false);
          setTextColor(activeObject.fill || "#000000");
          setTextBackgroundColor(activeObject.backgroundColor || "");
          setLetterSpacing(activeObject.charSpacing || 0);
        } else if (activeObject.type === "image") {
          setObjectType("image");

          if (activeObject.filters && activeObject.filters.length > 0) {
            const filterObj = activeObject.filters[0];
            if (filterObj.type === "Grayscale") setFilter("grayscale");
            else if (filterObj.type === "Sepia") setFilter("sepia");
            else if (filterObj.type === "Invert") setFilter("invert");
            else if (filterObj.type === "Blur") {
              setFilter("blur");
              setBlur(filterObj.blur * 100 || 0);
            } else setFilter("none");
          }

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        } else if (activeObject.type === "path") {
          setObjectType("path");

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        } else {
          setObjectType("shape");

          if (activeObject.fill && typeof activeObject.fill === "string") {
            setFillColor(activeObject.fill);
          }

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        }
      }
    };

    const handleSelectionCleared = () => setPosition(prev => ({ ...prev, visible: false }));

    // Add event listeners
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:moving', handleSelection);
    canvas.on('object:scaling', handleSelection);
    canvas.on('object:rotating', handleSelection);

    // Initial position update
    updatePosition();

    // Cleanup
    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:moving', handleSelection);
      canvas.off('object:scaling', handleSelection);
      canvas.off('object:rotating', handleSelection);
    };
  }, [canvas, updatePosition]);


  if (!position.visible) return null;

  return (
    <div
      className="fixed  z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'auto',
        transition: 'left 0.2s ease-out, top 0.2s ease-out'
      }}
    >
      <div className="flex flex-wrap max-w-[400px] items-center gap-1">
        {
          objectType == 'text' &&
          <div className="flex items-center gap-1">
            <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger id="font-family" className={"h-10"}>
                <SelectValue placeholder="Select Font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((fontItem) => (
                  <SelectItem
                    key={fontItem}
                    value={fontItem}
                    style={{ fontFamily: fontItem }}
                  >
                    {fontItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="font-size"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e)}
              className={"w-16 text-xs"}
              type={"number"}
            />
            <Button
              variant={fontWeight === "bold" ? "default" : "outline"}
              size="icon"
              onClick={handleToggleBold}
              className={"w-8 h-8"}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={fontStyle === "italic" ? "default" : "outline"}
              size="icon"
              onClick={handleToggleItalic}
              className={"w-8 h-8"}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={underline ? "default" : "outline"}
              size="icon"
              onClick={handleToggleUnderline}
              className={"w-8 h-8"}
            >
              <Underline className="w-4 h-4" />
            </Button>

            {/* <Label htmlFor="text-color" className="text-sm">
                  Text Color
                </Label> */}
            <div className="relative w-8 h-8 overflow-hidden rounded-md border">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: textColor }}
              />
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={handleToggleTextColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {/* <Label htmlFor="text-bg-color" className="text-sm">
                  Text BG Color
                </Label> */}
            <div className="relative w-8 h-8 overflow-hidden rounded-md border">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: textBackgroundColor }}
              />
              <Input
                id="text-bg-color"
                type="color"
                value={textBackgroundColor}
                onChange={handleToggleTextBackgroundColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {/* <div className="space-y-2">
              <div className="flex justify-between">
                <Label className={"text-xs"} htmlFor="letter-spacing">
                  Letter Spacing
                </Label>
                <span className="text-xs">{letterSpacing}</span>
              </div>
              <Slider
                id="letter-spacing"
                min={-200}
                max={800}
                step={10}
                value={[letterSpacing]}
                onValueChange={(value) => handleLetterSpacingChange(value)}
              />
            </div> */}
          </div>
        }
        { objectType == 'text' && <br /> }
        {
          objectType == 'shape' &&
          <div className="flex items-center gap-1">
            {/* <Label htmlFor="fill-color" className="text-xs">
                  Fill Color
                </Label> */}
            <div className="relative shrink-0 w-8 h-8 overflow-hidden rounded-md border">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: fillColor }}
              />
              <Input
                id="fill-color"
                type="color"
                value={fillColor}
                onChange={handleFillColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {/* <Label htmlFor="border-color" className="text-xs">
                  Border Color
                </Label> */}
            {/* <div className="relative shrink-0 w-8 h-8 overflow-hidden rounded-md border">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: borderColor }}
              />
              <Input
                id="fill-color"
                type="color"
                value={borderColor}
                onChange={handleBorderColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div> */}
            {/* <Label htmlFor="border-width" className={"text-xs"}>
                Border Width
              </Label>
              <span className={"text-xs mb-2"}>{borderWidth}%</span> */}
            {/* <div className='px-4 w-36'>
              <Slider
                id="border-width"
                min={0}
                max={20}
                step={1}
                value={[borderWidth]}
                onValueChange={(value) => handleBorderWidthChange(value)}
                className={'shrink-0 '}
              />
            </div> */}
            {/* <Label htmlFor="border-style" className={"text-xs"}>
                Border Style
              </Label> */}
            {/* <Select
              value={borderStyle}
              onValueChange={handleBorderStyleChange}
              className="shrink-0"
            >
              <SelectTrigger id="border-style" className={"h-10"}>
                <SelectValue placeholder="Select Border Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        }
        {
          objectType == 'image' &&
          <div className='flex items-center gap-1'>
            {/* <Label htmlFor="filter" className={"text-xs"}>
                Filter
              </Label> */}
            <Select value={filter} onValueChange={handleImageFilterChange}>
              <SelectTrigger id="filter" className={"h-10"}>
                <SelectValue placeholder="Select Image Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="grayscale">Grayscale</SelectItem>
                <SelectItem value="sepia">Sepia</SelectItem>
                <SelectItem value="invert">Invert</SelectItem>
                <SelectItem value="blur">Blur</SelectItem>
              </SelectContent>
            </Select>

            {filter === "blur" && (
              <Slider
                id="blur"
                min={0}
                max={100}
                step={1}
                value={[blur]}
                onValueChange={(value) => handleBlurChange(value)}
              />
            )}
          </div>
        }
        <Button
          onClick={handleBringToFront}
          variant={"outline"}
          size="sm"
          className={"h-8 text-xs"}
        >
          <MoveUp className="h-4 w-4" />
          <span>Bring to front</span>
        </Button>
        <Button
          onClick={handleSendToBack}
          variant={"outline"}
          size="sm"
          className={"h-8 text-xs"}
        >
          <MoveDown className="h-4 w-4" />
          <span>Send to back</span>
        </Button>
      </div>
    </div>
  );
};

export default EditPropertiesInlineEditor;