import { createClient } from '@/lib/supabase/server';
import F1Standings from './moal/page';   // Asegúrate que la ruta sea correcta

interface RaceResult {
  id?: number;
  position: number;
  name: string;
  teamId: number;
  points: number;
  id_carrera: number;
  totalTime: number;
  sancion_segundos?: number | null;
}

interface Circuito {
  id: number;
  name: string;
  country: string;
}

export default async function Home() {
  const supabase = await createClient();

  // 1. Actualizamos los nombres de los pilotos
  //await actualizarNombresDePilotos(supabase);

  // 2. Obtenemos los resultados
  const { data: resultadosRaw, error: errorResultados } = await supabase
    .from('resultadosV2')
    .select('*')
    .order('id_carrera', { ascending: false });

  if (errorResultados) {
    console.error('Error al consultar resultadosV2:', errorResultados);
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error al cargar los datos</h2>
          <p className="text-gray-400">No se pudieron obtener los resultados. Inténtalo más tarde.</p>
        </div>
      </div>
    );
  }

  const resultados: RaceResult[] = resultadosRaw ?? [];

  // 3. Obtenemos la lista de circuitos
  const { data: circuitosData, error: errorCircuitos } = await supabase
    .from('circuitosNew')
    .select('*');

  if (errorCircuitos) {
    console.error('Error al cargar circuitos:', errorCircuitos);
    // Continuamos sin circuitos (el componente tiene fallback)
  }

  const circuitos: Circuito[] = circuitosData ?? [];

  return (
    <F1Standings 
      data={resultados} 
      version="Fantasy" 
      circuitos={circuitos}
    />
  );
}

/**
 * Actualiza los nombres de los pilotos en la tabla resultadosV2
 * usando la información de la tabla 'cuentas'
 
async function actualizarNombresDePilotos(supabase: any) {   // Temporalmente any (puedes mejorar después)
  try {
    console.log('🔄 Iniciando actualización de nombres de pilotos...');

    const { data: cuentas, error: errorCuentas } = await supabase
      .from('cuentas')
      .select('game_id, name')
      .not('game_id', 'is', null);

    if (errorCuentas) {
      console.error('❌ Error al obtener cuentas:', errorCuentas);
      return; // No lanzamos error para no romper toda la página
    }

    if (!cuentas || cuentas.length === 0) {
      console.log('ℹ️ No hay cuentas disponibles para actualizar.');
      return;
    }

    console.log(`📊 Se encontraron ${cuentas.length} cuentas. Iniciando actualización...`);

    let actualizados = 0;
    let errores = 0;

    for (const cuenta of cuentas) {
      if (!cuenta.game_id || !cuenta.name) continue;

      const { error } = await supabase
        .from('resultadosV2')
        .update({ name: cuenta.name.trim() })
        .eq('name', cuenta.game_id);

      if (error) {
        console.error(`❌ Error actualizando ${cuenta.game_id}:`, error.message);
        errores++;
      } else {
        actualizados++;
        if (actualizados % 10 === 0 || actualizados === cuentas.length) {
          console.log(`✅ ${actualizados}/${cuentas.length} actualizados`);
        }
      }
    }

    console.log(`🎉 Actualización finalizada: ${actualizados} correctos | ${errores} errores`);

  } catch (err) {
    console.error('💥 Error general durante la actualización de nombres:', err);
  }
}
  */