import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
    const { data: notes } = await supabase.from("resultados").select().eq('equipo', 'Haas');

    
    console.log(notes);
    
  
    return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
