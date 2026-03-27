import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  const { error } = await supabase.rpc('actualizar_nombres_pilotos');

  if (error) {
    console.error('Error actualizando pilotos:', error);
    return Response.json({ success: false }, { status: 500 });
  }

  return Response.json({ success: true });
}