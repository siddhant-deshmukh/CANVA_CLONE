"use client";

import { centerCanvas } from "@/fabric/fabric-utils";
import { saveCanvasState, saveCanvasTemplateState } from "@/services/design-service";
import { debounce } from "lodash";
import { create } from "zustand";

export const useEditorStore = create((set, get) => ({
  canvas: null,
  setCanvas: (canvas) => {
    set({ canvas });
    if (canvas) {
      centerCanvas(canvas);
    }
  },

  isAdmin: false,
  setIsAdmin: (boolean) => set({ isAdmin: boolean }),

  designId: null,
  setDesignId: (id) => set({ designId: id }),
  
  templateId: null,
  setTemplateId: (id) => set({ templateId: id }),

  isEditing: true,
  setIsEditing: (flag) => set({ isEditing: flag }),

  name: "Untitled Design",
  setName: (value) => set({ name: value }),

  showProperties: false,
  setShowProperties: (flag) => set({ showProperties: flag }),

  saveStatus: "saved",
  setSaveStatus: (status) => set({ saveStatus: status }),
  lastModified: Date.now(),
  isModified: false,

  markAsModified: () => {
    const designId = get().designId;
    const templateId = get().templateId;

    if (designId) {
      set({
        lastModified: Date.now(),
        saveStatus: "Saving...",
        isModified: true,
      });

      get().debouncedSaveToServer();
    } else if (templateId) {
      set({
        lastModified: Date.now(),
        saveStatus: "Saving...",
        isModified: true,
      });

      get().debouncedSaveToServer();
    } else {
      console.error("markAsModified, No design ID Available");
    }
  },

  saveToServer: async () => {
    const designId = get().designId;
    const templateId = get().templateId;
    const canvas = get().canvas;

    if (!canvas) {
      console.log("No design ID Available or canvas instance is not available");
      return null;
    }

    try {
      let savedDesign;
      if(designId && templateId) {
        savedDesign = await saveCanvasState(canvas, designId, templateId, get().name);
      } else if (templateId) {
        savedDesign = await saveCanvasTemplateState(canvas, templateId, get().name);
      }

      set({
        saveStatus: "Saved",
        isModified: false,
      });

      return savedDesign;
    } catch (e) {
      set({ saveStatus: "Error" });
      return null;
    }
  },

  debouncedSaveToServer: debounce(() => {
    get().saveToServer();
  }, 500),

  userSubscription: null,
  setUserSubscription: (data) => set({ userSubscription: data }),

  userDesigns: [],
  setUserDesigns: (data) => set({ userDesigns: data }),

  userDesignsLoading: false,
  setUserDesignsLoading: (flag) => set({ userDesignsLoading: flag }),

  userTemplates: [],
  setUserTemplates: (data) => set({ userTemplates: data }),

  userTemplatesLoading: false,
  setUserTemplatesLoading: (flag) => set({ userTemplatesLoading: flag }),

  showPremiumModal: false,
  setShowPremiumModal: (flag) => set({ showPremiumModal: flag }),

  showDesignsModal: false,
  setShowDesignsModal: (flag) => set({ showDesignsModal: flag }),

  resetStore: () => {
    set({
      canvas: null,
      designId: null,
      templateId: null,
      isEditing: true,
      name: "Untitled Design",
      showProperties: false,
      saveStatus: "Saved",
      isModified: false,
      lastModified: Date.now(),
    });
  },
}));
