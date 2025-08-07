"use client";

import { useParams, useRouter } from "next/navigation";
import Canvas from "./canvas";
import Header from "./header";
import Sidebar from "./sidebar";
import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/store";
import { getUserDesignByID, getUserTemplateByID } from "@/services/design-service";
import Properties from "./properties";
import SubscriptionModal from "../subscription/premium-modal";
import EditPropertiesInlineEditor from "./EditProperTiesInlineEditor";

function MainEditor() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.template_id;
  const designId = params?.design_id;

  const [isLoading, setIsLoading] = useState(!!templateId);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [error, setError] = useState(null);

  const {
    canvas,
    setTemplateId,
    setDesignId,
    resetStore,
    setName,
    setShowProperties,
    showProperties,
    isEditing,
    setShowPremiumModal,
    showPremiumModal,
  } = useEditorStore();

  useEffect(() => {
    //reset the store
    resetStore();

    //set the template id

    if (templateId) setTemplateId(templateId);
    if (designId) setDesignId(designId);
    return () => {
      resetStore();
    };
  }, []);

  useEffect(() => {
    setLoadAttempted(false);
    setError(null);
  }, [templateId]);

  useEffect(() => {
    if (isLoading && !canvas && templateId) {
      const timer = setTimeout(() => {
        if (isLoading) {
          console.log("Canvas init timeout");
          setIsLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, canvas, templateId]);

  useEffect(() => {
    if (canvas) {
      console.log("Canvas is now available in editor");
    }
  }, [canvas]);

  //load the template ->
  const loadTemplate = useCallback(async () => {
    if (!canvas || !templateId || loadAttempted) return;
    try {
      setIsLoading(true);
      setLoadAttempted(true);

      let template;

      if (designId) {
        let response = await getUserDesignByID(designId);
        console.log('get design by ID', response)
        template = response.data;
        if (!template || !template.canvasData) {
          let response = await getUserTemplateByID(templateId);
          console.log('get template by ID', response)
          template = response.data;
        } else {
          const templateCanvasDataObject = JSON.parse(template.canvasData);
          if (!Array.isArray(templateCanvasDataObject.objects) || templateCanvasDataObject.objects.length < 1) {
            let response = await getUserTemplateByID(templateId);
            console.log('get template by ID', response)
            template = response.data;
          }
        }
      } else {
        let response = await getUserTemplateByID(templateId);
        console.log('get template by ID', response)
        template = response.data;
      }


      if (template) {
        //update name
        setName(template.name);

        //set the template ID just incase after getting the data
        if (templateId) setTemplateId(templateId);
        if (designId) setDesignId(designId);

        try {
          if (template.canvasData) {
            canvas.clear();
            if (template.width && template.height) {
              canvas.setDimensions({
                width: template.width,
                height: template.height,
              });
            }

            const canvasData =
              typeof template.canvasData === "string"
                ? JSON.parse(template.canvasData)
                : template.canvasData;

            const hasObjects =
              canvasData.objects && canvasData.objects.length > 0;

            if (canvasData.background) {
              canvas.backgroundColor = canvasData.background;
            } else {
              canvas.backgroundColor = "#ffffff";
            }

            if (!hasObjects) {
              canvas.renderAll();
              return true;
            }

            canvas
              .loadFromJSON(template.canvasData)
              .then((canvas) => {
                canvas.requestRenderAll();
                if (designId) {
                  canvas.forEachObject(function (obj) {
                    // obj.selectable = false;
                    // obj.evented = false;
                    if (obj.type !== "i-text") {
                      obj.lockMovementX = true;
                      obj.lockMovementY = true;
                      obj.lockScalingX = true;
                      obj.lockScalingY = true;
                      obj.lockRotation = true;
                      obj.hasControls = false;
                      obj.hoverCursor = 'pointer';
                      obj.moveCursor = 'pointer';
                    } else {
                      obj.hoverCursor = 'move';
                      obj.moveCursor = 'move';
                    }
                    obj.hasBorders = true;
                  });
                }
              });
          } else {
            console.log("no canvas data");
            canvas.clear();
            canvas.setWidth(template.width);
            canvas.setHeight(template.height);
            canvas.backgroundColor = "#ffffff";
            canvas.renderAll();
          }
        } catch (e) {
          console.error(("Error loading canvas", e));
          setError("Error loading canvas");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (e) {
      console.error("Failed to load template", e);
      setError("failed to load template");
      setIsLoading(false);
    }
  }, [canvas, templateId, designId, setTemplateId, loadAttempted, setDesignId]);

  useEffect(() => {
    if (templateId && canvas && !loadAttempted) {
      loadTemplate();
    } else if (!templateId) {
      router.replace("/");
    }
  }, [canvas, templateId, loadTemplate, loadAttempted, router]);

  useEffect(() => {
    if (!canvas) return;

    const handleSelectionCreated = () => {
      const activeObject = canvas.getActiveObject();

      console.log(activeObject, "activeObject");

      if (activeObject) {
        setShowProperties(true);
      }
    };

    const handleSelectionCleared = () => {
      setShowProperties(false);
    };

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionCreated);
    canvas.on("selection:cleared", handleSelectionCleared);

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionCreated);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [canvas]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {isEditing && !designId && <Sidebar />}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 overflow-hidden bg-[#f0f0f0] flex items-center justify-center">
            <Canvas />
          </main>
        </div>
      </div>
      {showProperties && !designId && isEditing && <Properties />}
      { designId && isEditing && <EditPropertiesInlineEditor /> }
      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={setShowPremiumModal}
      />
    </div>
  );
}

export default MainEditor;
