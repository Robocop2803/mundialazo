import { createClient } from '@/lib/supabase/server';
import F1Standings from './moal/page';

interface RaceResult {
  position: number;
  name: string;
  teamId: number;
  points: number;
  id_carrera: number;
  // ... y cualquier otro campo que realmente tenga tu tabla
}

export default async function Home() {
  const supabase = await createClient();

  const { data: resultadosRaw, error } = await supabase
    .from('resultadosV2')
    .select('*');

  // Manejo básico de error / null
  if (error) {
    console.error('Error al consultar resultadosV2:', error);
    // Aquí podrías devolver un componente de error o fallback
    return <div>Error al cargar los datos</div>;
  }

  // Aseguramos que sea RaceResult[] (o array vacío si null)
  const resultados: RaceResult[] = resultadosRaw ?? [];

  console.log(resultados);
  

  return (
    <F1Standings 
      data={resultados} 
      version="MOAL 1º edición"
    />
  );
}