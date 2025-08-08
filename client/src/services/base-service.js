import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { toast } from "sonner";

const API_URL = process.env.API_URL || "http://localhost:3079";

export async function fetchWithAuth(endpoint, options = {}) {
  const session = await getSession();

  if (!session || !session.idToken) {
    await signOut();
    // throw new Error("Not authenticated");
  }

  try {
    const response = await axios({
      url: `${API_URL}${endpoint}`,
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${session.idToken}`,
        ...options.headers,
      },
      data: options.body,
      params: options.params,
    });

    return response.data;
  } catch (error) {
    console.error(endpoint, error);
    if(error && error.response && error.response.status == 401) {
      await signOut();
    } else {
      toast.error('Something went wrong')
    }
  }
}
