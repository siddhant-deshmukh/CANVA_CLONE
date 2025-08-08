// --- FRONTEND: app/media/page.js ---
"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { fetchWithAuth, uploadFileWithAuth } from "@/lib/fetcher";

export default function MediaManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userUploads, setUserUploads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategories, setFilterCategories] = useState([]);

  const { data: session, status } = useSession();

  const fetchUserUploads = useCallback(async () => {
    if (status !== "authenticated" || !session?.idToken) return;
    try {
      setIsLoading(true);
      const data = await fetchWithAuth("/v1/media/get");
      setUserUploads(data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [status, session?.idToken]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/v1/media/categories");
      setCategories(res?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserUploads();
      fetchCategories();
    }
  }, [status, fetchUserUploads, fetchCategories]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const result = await uploadFileWithAuth(file, {
        category: selectedCategory,
      });
      setUserUploads((prev) => [result?.data, ...prev]);
    } catch (e) {
      console.error("Error while uploading the file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateCategory = async () => {
    try {
      const res = await fetchWithAuth("/v1/media/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategory }),
      });
      setCategories((prev) => [...prev, res.data]);
      setNewCategory("");
    } catch (e) {
      console.error("Error creating category", e);
    }
  };

  const filteredImages = filterCategories.length
    ? userUploads.filter((img) =>
        img.categories?.some((cat) => filterCategories.includes(cat))
      )
    : userUploads;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Media Manager</h1>

      <div className="space-y-2">
        <Input type="file" onChange={handleFileUpload} disabled={isUploading} />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Input
            placeholder="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button onClick={handleCreateCategory}>Create</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat._id}
              variant={filterCategories.includes(cat._id) ? "default" : "outline"}
              onClick={() =>
                setFilterCategories((prev) =>
                  prev.includes(cat._id)
                    ? prev.filter((id) => id !== cat._id)
                    : [...prev, cat._id]
                )
              }
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredImages.map((imageData) => (
          <div
            key={imageData._id}
            className="aspect-auto bg-gray-50 rounded-md overflow-hidden hover:opacity-85 transition-opacity"
          >
            <img
              src={imageData.url}
              alt={imageData.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
