"use client";

import Banner from "@/components/home/banner";
import TemplateTypes from "@/components/home/template-types";
import DesignModal from "@/components/home/designs-modal";
import Header from "@/components/home/header";
import SideBar from "@/components/home/sidebar";
import SubscriptionModal from "@/components/subscription/premium-modal";
import { getUserDesigns, getUserTemplates } from "@/services/design-service";
import { getUserSubscription } from "@/services/subscription-service";
import { useEditorStore } from "@/store";
import { useEffect, useState } from "react";
import RecentTemplates from "@/components/home/recent-templates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DesignList from "@/components/home/design-list";
import TemplateList from "@/components/home/template-list";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const {
    setUserSubscription,
    setUserDesigns,
    setUserTemplates,
    showPremiumModal,
    setShowPremiumModal,
    showDesignsModal,
    setShowDesignsModal,
    userDesigns,
    userDesignsLoading,
    setUserDesignsLoading,
    userTemplates,
    userTemplatesLoading,
    setUserTemplatesLoading,
  } = useEditorStore();

  //* Tab / Design view switch tabs
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    console.log(searchParams, searchParams.get('tab'))
    if(!searchParams.get('tab') || !["designs", "template"].includes(searchParams.get('tab'))) {
      setActiveTab("designs")
      router.push(`?tab=designs`);
    } else {
      setActiveTab(searchParams.get('tab'))
    }

    
  }, [router, searchParams, initialTab]);

  const handleTabChange = (value) => {
    router.push(`?tab=${value}`);
  };

  const fetchUserSubscription = async () => {
    const response = await getUserSubscription();

    if (response.success) setUserSubscription(response.data);
  };

  async function fetchUserDesigns() {
    setUserDesignsLoading(true);
    const result = await getUserDesigns();

    if (result?.success) {
      setUserDesigns(result?.data);
      setUserDesignsLoading(false);
    }
  }

  async function fetchUserTemplates() {
    setUserTemplatesLoading(true);
    const result = await getUserTemplates();

    if (result?.success) {
      setUserTemplates(result?.data);
      setUserTemplatesLoading(false);
    }
  }

  useEffect(() => {
    fetchUserSubscription();
    fetchUserDesigns();
    fetchUserTemplates();
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <SideBar />
      <div className="flex-1 flex flex-col ml-[72px]">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto pt-20">
          <Banner />
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className={"my-10"}
          >
            <TabsList>
              <TabsTrigger value="template">
                Templates
              </TabsTrigger>
              <TabsTrigger value="designs">
                Designs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="template" >
              <TemplateTypes />
              {/* <AiFeatures /> */}
              <RecentTemplates />
            </TabsContent>
            <TabsContent value="designs" className={"flex flex-col gap-5"}>
              <h2 className="text-xl font-bold mt-5">Choose a template</h2>
              <TemplateList
                listOfTemplates={
                  userTemplates ? userTemplates.slice(0, 4) : []
                }
                isLoading={userTemplatesLoading}
                isModalView={false}
                createDesign={true}
              />
              <h2 className="text-xl font-bold">Recent Designs</h2>
              <DesignList
                listOfDesigns={
                  userDesigns && userDesigns.length > 0 ? userDesigns.slice(0, 4) : []
                }
                isLoading={userDesignsLoading}
                isModalView={false}
              />
            </TabsContent>
          </Tabs>

        </main>
      </div>
      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={setShowPremiumModal}
      />
      <DesignModal
        isOpen={showDesignsModal}
        onClose={setShowDesignsModal}
        userDesigns={userDesigns}
        setShowDesignsModal={setShowDesignsModal}
        userDesignsLoading={userDesignsLoading}
      />
    </div>
  );
}
