// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface Cuenta {
  id?: number;
  game_id: string;
  name: string;
}

const NOMBRES_POSIBLES = ['ESPADA', 'CASTAN', 'DAVO'] as const;

export default async function CuentasPage() {
  const supabase = await createClient();

  // Obtener todas las cuentas
  const { data: cuentasData, error: errorCuentas } = await supabase
    .from('cuentas')
    .select('*')
    .order('game_id', { ascending: true });

  if (errorCuentas) {
    console.error('Error al cargar cuentas:', errorCuentas);
  }

  // Aseguramos que siempre sea un array
  const cuentas: Cuenta[] = cuentasData ?? [];

  // Obtener nombres únicos de resultadosV2
  const { data: resultadosRaw } = await supabase
    .from('resultadosV2')
    .select('name')
    .not('name', 'is', null);

  const nombresEnResultados = Array.from(
    new Set(
      (resultadosRaw ?? []).map((r) => r.name).filter((name): name is string => Boolean(name))
    )
  ).sort();

  const gameIdsRegistrados = new Set(cuentas.map((c) => c.game_id));

  const nombresDisponibles = nombresEnResultados.filter(
    (nombre) => !gameIdsRegistrados.has(nombre)
  );

  // ==================== SERVER ACTION ====================
  async function agregarCuenta(formData: FormData) {
    'use server';

    const game_id = (formData.get('game_id') as string)?.trim();
    const name = formData.get('name') as string;

    if (!game_id || !NOMBRES_POSIBLES.includes(name as typeof NOMBRES_POSIBLES[number])) {
      console.error('Datos inválidos para agregar cuenta');
      revalidatePath('/admin');
      return;
    }

    const supabaseAction = await createClient();

    const { error } = await supabaseAction
      .from('cuentas')
      .insert({ game_id, name });

    if (error) {
      console.error('Error al insertar en cuentas:', error);
    } else {
      console.log(`✅ Cuenta añadida correctamente: ${game_id} → ${name}`);
    }

    revalidatePath('/admin');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Gestión de Cuentas</h1>
          <p className="text-gray-400">Asignar ESPADA, CASTAN o DAVO a pilotos</p>
        </div>

        {/* Formulario para añadir */}
        <div className="bg-gray-900 rounded-3xl p-8 mb-12 border border-gray-800">
          <h2 className="text-2xl font-semibold mb-6">Añadir nueva asignación</h2>

          <form action={agregarCuenta} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Piloto (game_id)
              </label>
              <select
                name="game_id"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500"
              >
                <option value="">Seleccionar piloto...</option>
                {nombresDisponibles.length > 0 ? (
                  nombresDisponibles.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay pilotos disponibles para asignar</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Asignar como</label>
              <select
                name="name"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500"
              >
                <option value="">Seleccionar tipo...</option>
                {NOMBRES_POSIBLES.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 transition-all py-4 rounded-2xl font-semibold text-lg active:scale-[0.98]"
              >
                Añadir Asignación
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de cuentas */}
        <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800">
          <div className="px-8 py-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">
              Cuentas Registradas ({cuentas.length})
            </h2>
          </div>

          {cuentas.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              Aún no hay cuentas registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-950">
                  <tr>
                    <th className="px-8 py-4 text-left text-gray-400 font-medium">game_id / Piloto</th>
                    <th className="px-8 py-4 text-left text-gray-400 font-medium">Asignado como</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cuentas.map((cuenta) => (
                    <tr key={cuenta.id} className="hover:bg-gray-800/50">
                      <td className="px-8 py-5 font-mono text-lg">{cuenta.game_id}</td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex px-6 py-2 rounded-full text-sm font-bold ${
                            cuenta.name === 'ESPADA'
                              ? 'bg-purple-600/20 text-purple-400'
                              : cuenta.name === 'CASTAN'
                              ? 'bg-amber-600/20 text-amber-400'
                              : 'bg-cyan-600/20 text-cyan-400'
                          }`}
                        >
                          {cuenta.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}