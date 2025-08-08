"use client";

import { useRouter } from "next/navigation";
import DesignPreview from "./design-preview";
import { Loader, Trash2 } from "lucide-react";
import { deleteTemplate, getUserTemplates, saveDesign } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { useState } from "react";

function TemplateList({
  listOfTemplates,
  isLoading,
  isModalView,
  setShowDesignsModal,
  createDesign,
}) {
  const router = useRouter();
  const { setUserTemplates } = useEditorStore();
  const [loading, setLoading] = useState(false);

  async function fetchUserTemplates() {
    const result = await getUserTemplates();

    if (result?.success) setUserTemplates(result?.data);
  }

  const handleDeleteTemplate = async (getCurrentDesignId) => {
    const response = await deleteTemplate(getCurrentDesignId);

    if (response.success) {
      fetchUserTemplates();
    }
  };

  const createNewDesign = async (templateId) => {
    if (loading) return;

    setLoading(true);

    const initialDesignData = {
      name: "Untitled design",
      canvasData: null,
      templateId,
      width: 825,
      height: 465,
      category: "youtube_thumbnail",
    };

    const newDesign = await saveDesign(initialDesignData);

    if (newDesign?.success) {
      router.push(`/editor/${templateId}/${newDesign?.data?._id}`);
      setLoading(false);
    } else {
      throw new Error("Failed to create new design");
    }
  }

  if (isLoading) return <Loader className="animate-spin" />;

  return (
    <div
      className={`${isModalView ? "p-4" : ""
        } flex flex-wrap gap-4`}
    >
      {!listOfTemplates.length && <h1>No Templates Found!</h1>}
      {listOfTemplates.map((design) => (
        <div key={design._id} className="group cursor-pointer w-[500px] rounded-xl overflow-hidden border shadow">
          <div
            onClick={() => {
              if(createDesign) {
                createNewDesign(design._id);
              } else {
                router.push(`/editor/${design?._id}`);
                isModalView ? setShowDesignsModal(false) : null;
              }
            }}
            className="w-[500px] h-[300px] overflow-hidden transition-shadow group-hover:shadow-md"
          >
            {design?.canvasData && (
              <DesignPreview key={design._id} design={design} />
            )}
          </div>
          <div className="flex items-center p-3 justify-between">
            <p className="font-bold text-xl truncate">{design.name}</p>
            <Trash2
              onClick={() => handleDeleteTemplate(design?._id)}
              className="w-5 h-5 "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TemplateList;
