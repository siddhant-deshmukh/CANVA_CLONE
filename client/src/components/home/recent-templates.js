"use client";

import { useEditorStore } from "@/store";
import TemplateList from "./template-list";

function RecentTemplates() {
  const { userTemplates, userTemplatesLoading } = useEditorStore();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recent Templates</h2>
      <TemplateList
        listOfTemplates={
          userTemplates && userTemplates.length > 0 ? userTemplates.slice(0, 4) : []
        }
        isLoading={userTemplatesLoading}
        isModalView={false}
      />
    </div>
  );
}

export default RecentTemplates;
