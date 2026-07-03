import { supabase } from "./supabase";

/**
 * Faz o upload de um documento de viagem para o bucket privado `travel_docs`
 * Organiza em pastas: user_id/timestamp_filename
 */
export async function uploadTravelDoc(
  userId: string,
  file: File,
  name: string
): Promise<{ path: string; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filePath = `${userId}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from("travel_docs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { path: "", error };
    }

    return { path: data.path, error: null };
  } catch (err: any) {
    return { path: "", error: err.message || err };
  }
}

/**
 * Remove um documento de viagem do Supabase Storage
 */
export async function deleteTravelDoc(filePath: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.storage
      .from("travel_docs")
      .remove([filePath]);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Cria uma URL assinada (temporária e segura) para visualizar/baixar o documento privado
 * Expiração padrão: 1 hora (3600 segundos)
 */
export async function getTravelDocUrl(filePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from("travel_docs")
      .createSignedUrl(filePath, 3600);

    if (error || !data) {
      console.error("Erro ao gerar URL assinada:", error);
      return "";
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Erro ao gerar URL assinada:", err);
    return "";
  }
}
