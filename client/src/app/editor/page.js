"use client";

import { useEditorStore } from "@/store";
import TemplateList from "@/components/home/template-list";
import { getUserDesigns, getUserTemplates } from "@/services/design-service";
import { useEffect } from "react";
import DesignList from "@/components/home/design-list";
import Sidebar from "@/components/home/sidebar";
import Header from "@/components/home/header";

function RecentDesigns() {
  const {
    userDesigns, userDesignsLoading, setUserDesigns, setUserDesignsLoading,
    userTemplates, userTemplatesLoading, setUserTemplatesLoading, setUserTemplates,
  } = useEditorStore();


  async function fetchUserTemplates() {
    setUserTemplatesLoading(true);
    const result = await getUserTemplates();

    if (result?.success) {
      setUserTemplates(result?.data);
      setUserTemplatesLoading(false);
    }
  }
  async function fetchUserDesigns() {
    setUserDesignsLoading(true);
    const result = await getUserDesigns();
    if (result.success) {
      setUserDesigns(result.data);
      setUserDesignsLoading(false);
    }
  }

  useEffect(() => {
    fetchUserTemplates();
    fetchUserDesigns();
  }, []);

  return (
    <div className="flex h-screen overflow-y-auto bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[72px]">
        <Header />
        <main className="pt-20">
          <div className="p-6 flex flex-col gap-7 ">
            <h1 className="text-3xl font-bold">Choose a Template</h1>
            <TemplateList
              listOfTemplates={
                userTemplates ? userTemplates.slice(0, 4) : []
              }
              isLoading={userTemplatesLoading}
              isModalView={false}
              createDesign={true}
            />
            <hr className="" />
            <h1 className="text-3xl font-bold">Recent Designs</h1>
            <DesignList
              listOfDesigns={
                userDesigns && userDesigns.length > 0 ? userDesigns.slice(0, 4) : []
              }
              isLoading={userDesignsLoading}
              isModalView={false}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default RecentDesigns;
