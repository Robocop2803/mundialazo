import { createClient } from '@/lib/supabase/server';
import F1Standings from './moal/page';

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

export default async function Home() {
  const supabase = await createClient();

  // Actualizamos los nombres antes de cargar los resultados
  await actualizarNombresDePilotos(supabase);

  // Obtenemos los resultados actualizados
  const { data: resultadosRaw, error } = await supabase
    .from('resultadosV2')
    .select('*')
    .order('id_carrera', { ascending: false }); // opcional: ordenar por carrera más reciente

  if (error) {
    console.error('Error al consultar resultadosV2:', error);
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

  return <F1Standings data={resultados} version="MOAL" />;
}

/**
 * Actualiza los nombres de los pilotos en la tabla resultadosV2
 * usando la información de la tabla 'cuentas'
 */
async function actualizarNombresDePilotos(supabase: any) {
  try {
    console.log('🔄 Iniciando actualización de nombres de pilotos...');

    const { data: cuentas, error: errorCuentas } = await supabase
      .from('cuentas')
      .select('game_id, name')
      .not('game_id', 'is', null);

    if (errorCuentas) {
      console.error('❌ Error al obtener cuentas:', errorCuentas);
      throw errorCuentas;
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
        .eq('name', cuenta.game_id);   // Match: donde el name actual es el game_id

      if (error) {
        console.error(`❌ Error actualizando ${cuenta.game_id}:`, error.message);
        errores++;
      } else {
        actualizados++;
        // Opcional: mostrar solo cada 10 para no saturar la consola
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