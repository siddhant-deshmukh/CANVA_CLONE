import axios from "axios";
import { getSession } from "next-auth/react";
import { fetchWithAuth } from "./base-service";

const API_URL = process.env.API_URL || "http://localhost:3079";

export async function uploadFileWithAuth(file, metaData = {}) {
  const session = await getSession();

  if (!session || !session.idToken) {
     await signOut();
    // throw new Error("Not authenticated");
  }

  const formData = new FormData();
  formData.append("file", file);

  Object.entries(metaData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await axios.post(`${API_URL}/v1/media/upload`, formData, {
      headers: {
        Authorization: `Bearer ${session.idToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    if(error && error.response && error.response.status == 401) {
      await signOut();
    } else {
      toast.error('Something went wrong')
    }
  }
}

export async function generateImageFromAI(prompt) {
  try {
    const response = await fetchWithAuth("/v1/media/ai-image-generate", {
      method: "POST",
      body: {
        prompt,
      },
    });

    return response;
  } catch (e) {
    throw new Error(e.message);
  }
}
