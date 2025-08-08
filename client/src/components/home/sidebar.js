"use client";

import Link from "next/link";
import { LayoutTemplateIcon, Home, Edit3Icon, ImageIcon } from "lucide-react";

function SideBar() {

  return (
    <aside className="w-[72px] bg-[#f8f8fc] border-r flex flex-col items-center py-4 fixed left-0 top-0 h-full z-20">
      <nav className="mt-8 flex flex-col items-center space-y-6 w-full">
        {[
          {
            icon: <Home className="h-6 w-6" />,
            label: "Home",
            link: '/',
            active: true,
          },
          {
            icon: <Edit3Icon className="h-6 w-6" />,
            label: "Design",
            active: true,
            link: '?tab=designs'
          },
          {
            icon: <LayoutTemplateIcon className="h-6 w-6" />,
            label: "Template",
            active: true,
            link: '?tab=template'
          },
          {
            icon: <ImageIcon className="h-6 w-6" />,
            label: "Images",
            active: true,
            link: '?tab=template'
          }
        ].map((menuItem, index) => (
          <Link
            key={index}
            href={menuItem.link}
            className="flex cursor-pointer flex-col items-center w-full"
          >
            <div className="w-full flex flex-col items-center py-2 text-gray-600 hover:bg-gray-100 hover:text-purple-600">
              <div className="relative">{menuItem.icon}</div>
              <span className="text-xs font-medium mt-1">{menuItem.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default SideBar;
