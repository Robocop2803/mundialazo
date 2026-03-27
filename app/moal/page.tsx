'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './clasificacion.module.css';
import { createClient } from '@/lib/supabase/client';// cliente de Supabase para browser

const supabase = createClient();

interface RaceResult {
  id?: number;                  // NECESARIO para poder actualizar el registro
  position: number;
  name: string;
  teamId: number;
  points: number;
  id_carrera: number;
  totalTime: number;
  sancion_segundos?: number | null;
  sancion_posiciones?: number | null;
}

interface Circuito {
  id: number;
  name: string;
  country: string;
}



const circuitos: Circuito[] = [
  { id: 0, name: 'Albert Park', country: 'Australia' },
  { id: 2, name: 'Shanghai', country: 'China' }
  // ... añade el resto de circuitos que tengas
];


const TEAM_NAMES: Record<number, string> = {
  0: 'Mercedes-AMG Petronas',
  1: 'Scuderia Ferrari HP',
  2: 'Red Bull',
  3: 'Williams',
  4: 'Aston Martin',
  5: 'Alpine',
  6: 'Visa Cash App RB',
  7: 'Haas',
  8: 'McLaren',
  9: 'KICK Sauber',
};

const TEAM_PILOTO_CLASS: Record<string, string> = {
  'McLaren': styles.mcLarenPiloto,
  'Red Bull': styles.redBullPiloto,
  'Mercedes-AMG Petronas': styles.mercedesPiloto,
  'Scuderia Ferrari HP': styles.ferrariPiloto,
  'Williams': styles.williamsPiloto,
  'Alpine': styles.alpinePiloto,
  'Aston Martin': styles.astonMartinPiloto,
  'Visa Cash App RB': styles.visaCashAppRBPiloto,
  'Haas': styles.haasPiloto,
  'KICK Sauber': styles.kickSauberPiloto,
  'chaquetero': styles.chaquetero,
};

const TEAM_LOGO_CLASS: Record<string, string> = {
  'McLaren': styles.mcLarenLogo,
  'Red Bull': styles.redBullLogo,
  'Mercedes-AMG Petronas': styles.mercedesLogo,
  'Scuderia Ferrari HP': styles.ferrariLogo,
  'Williams': styles.williamsLogo,
  'Alpine': styles.alpineLogo,
  'Aston Martin': styles.astonMartinLogo,
  'Visa Cash App RB': styles.rbHondaLogo,
  'Haas': styles.haasLogo,
  'KICK Sauber': styles.kickSauberLogo,
};

const PILOTO_FOTO_CLASS: Record<string, string> = {
  VERSTAPPEN: styles.pilotoVerstappen,
  LECLERC: styles.pilotoLeclerc,
  HAMILTON: styles.pilotoHamilton,
  ALONSO: styles.pilotoAlonso,
  NORRIS: styles.pilotoNorris,
  RUSSELL: styles.pilotoRussell,
  PÉREZ: styles.pilotoPerez,
  SAINZ: styles.pilotoSainz,
  // ... añade los que tengas
};

const PILOTOS_FANTASY = new Set(['CASTAN', 'ESPADA', 'DAVO']);

function getTeamName(teamId: number): string {
  return TEAM_NAMES[teamId] ?? 'chaquetero';
}

function getClassEquipo(equipo: string): string {
  return TEAM_PILOTO_CLASS[equipo] ?? styles.nullPiloto;
}

function getClassEquipoLogo(equipo: string): string {
  const logo = TEAM_LOGO_CLASS[equipo] ?? styles.nullLogo;
  return `${styles.logo} ${logo}`;
}

function getClassPilotoFoto(piloto: string, equipo: string): string {
  if (PILOTOS_FANTASY.has(piloto)) {
    const safeEquipo = equipo.replace(/[^a-zA-Z]/g, '');
    const key = `${piloto.toLowerCase()}${safeEquipo}`;
    return `${styles.cara} ${styles[key] ?? styles.pilotoNull}`;
  }
  const foto = PILOTO_FOTO_CLASS[piloto] ?? styles.pilotoNull;
  return `${styles.cara} ${foto}`;
}

function getCircuitoInfo(id: number | null): string {
  if (id === null) return 'Carrera desconocida';
  const c = circuitos.find((circ) => circ.id === id);
  return c ? `${c.name} (${c.country})` : `Carrera ${id}`;
}

const POINTS_BY_POSITION = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

interface ResultRow {
  id?: number;
  posicion: number;
  posicionOriginal?: number;
  piloto: string;
  equipo: string;
  puntos: number;
  sancionTexto?: string;
  sancion_segundos?: number | null;
  sancion_posiciones?: number | null;
}

interface F1StandingsProps {
  data: RaceResult[];
  version?: string;
}

export default function F1Standings({ data = [], version }: F1StandingsProps) {
  const [modo, setModo] = useState<'general' | 'carrera'>('general');
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<number | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [sancionTipo, setSancionTipo] = useState<'segundos' | 'posiciones'>('segundos');
  const [sancionValor, setSancionValor] = useState<number>(0);
  const [loadingSave, setLoadingSave] = useState(false);


  const carrerasDisponibles = Array.from(new Set(data.map(r => r.id_carrera)))
    .sort((a, b) => b - a);

  useEffect(() => {
    if (carrerasDisponibles.length > 0 && carreraSeleccionada === null) {
      setCarreraSeleccionada(carrerasDisponibles[0]);
    }
  }, [carrerasDisponibles, carreraSeleccionada]);

  const handleGuardarSancion = async (driver: ResultRow) => {
    if (!driver.id) {
      alert('No se encontró el ID del registro para actualizar');
      return;
    }

    setLoadingSave(true);

    const updateData: Partial<RaceResult> = {};
    if (sancionTipo === 'segundos') {
      updateData.sancion_segundos = sancionValor > 0 ? sancionValor : null;
      updateData.sancion_posiciones = null; // opcional: limpiar el otro
    } else {
      updateData.sancion_posiciones = sancionValor !== 0 ? -Math.abs(sancionValor) : null;
      updateData.sancion_segundos = null; // opcional: limpiar el otro
    }

    const { error } = await supabase
      .from('resultadosV2')
      .update(updateData)
      .eq('id', driver.id);

    setLoadingSave(false);

    if (error) {
      console.error('Error al guardar sanción:', error);
      alert('Error al guardar la sanción: ' + error.message);
    } else {
      alert('Sanción guardada correctamente');
      setEditingDriverId(null);
      setSancionValor(0);
      window.location.reload(); // recarga simple para ver cambios
    }
  };

  let resultados: ResultRow[] = [];

  if (modo === 'general') {
    const byCarrera: Record<number, RaceResult[]> = data.reduce((acc, r) => {
      if (!acc[r.id_carrera]) acc[r.id_carrera] = [];
      acc[r.id_carrera].push(r);
      return acc;
    }, {} as Record<number, RaceResult[]>);

    const puntosPorPiloto: Record<string, { puntos: number; equipo: string }> = {};

    Object.values(byCarrera).forEach(rows => {
      const conAjuste = rows.map(r => ({
        ...r,
        tiempoAjustado: r.totalTime + (r.sancion_segundos ?? 0),
      }));

      const ordenados = [...conAjuste].sort((a, b) => a.tiempoAjustado - b.tiempoAjustado);

      ordenados.forEach((r, i) => {
        const pos = i + 1;
        const puntosNuevos = pos <= POINTS_BY_POSITION.length ? POINTS_BY_POSITION[pos - 1] : 0;
        const piloto = r.name;
        const equipo = getTeamName(r.teamId);

        if (!puntosPorPiloto[piloto]) {
          puntosPorPiloto[piloto] = { puntos: 0, equipo };
        }

        puntosPorPiloto[piloto].puntos += puntosNuevos;

        if (puntosPorPiloto[piloto].equipo !== equipo && puntosPorPiloto[piloto].equipo !== 'chaquetero') {
          puntosPorPiloto[piloto].equipo = 'chaquetero';
        }
      });
    });

    resultados = Object.entries(puntosPorPiloto)
      .map(([piloto, { puntos, equipo }]) => ({ piloto, equipo, puntos }))
      .sort((a, b) => b.puntos - a.puntos)
      .map((item, i) => ({ ...item, posicion: i + 1 }));
  } 
  else if (carreraSeleccionada !== null) {
    const rows = data.filter(r => r.id_carrera === carreraSeleccionada);

    const conAjuste = rows.map(r => ({
      ...r,
      tiempoAjustado: r.totalTime + (r.sancion_segundos ?? 0),
    }));

    const ordenados = [...conAjuste].sort((a, b) => a.tiempoAjustado - b.tiempoAjustado);

    resultados = ordenados.map((r, i) => {
      const posFinal = i + 1;
      const puntosNuevos = posFinal <= POINTS_BY_POSITION.length ? POINTS_BY_POSITION[posFinal - 1] : 0;

      const sancionTexto: string[] = [];
      if (r.sancion_segundos && r.sancion_segundos > 0) {
        sancionTexto.push(`+${r.sancion_segundos}s`);
      }
      if (r.sancion_posiciones && r.sancion_posiciones < 0) {
        sancionTexto.push(`${r.sancion_posiciones} pos`);
      }

      return {
        id: r.id,
        posicion: posFinal,
        posicionOriginal: r.position,
        piloto: r.name,
        equipo: getTeamName(r.teamId),
        puntos: puntosNuevos,
        sancionTexto: sancionTexto.length > 0 ? sancionTexto.join(' + ') : undefined,
        sancion_segundos: r.sancion_segundos,
        sancion_posiciones: r.sancion_posiciones,
      };
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Clasificación {version || ''}
        </h1>

        <div className="flex justify-center gap-6 mb-8 border-b border-gray-700">
          <button
            onClick={() => setModo('general')}
            className={`pb-2 font-semibold transition ${modo === 'general' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            Clasificación general
          </button>
          <button
            onClick={() => setModo('carrera')}
            className={`pb-2 font-semibold transition ${modo === 'carrera' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            Carreras
          </button>
        </div>

        {modo === 'carrera' && (
          <div className="flex justify-center mb-6">
            <select
              value={carreraSeleccionada ?? ''}
              onChange={(e) => setCarreraSeleccionada(Number(e.target.value))}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600"
            >
              {carrerasDisponibles.map(c => (
                <option key={c} value={c}>
                  {getCircuitoInfo(c)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-center text-gray-400 mb-8">
          {modo === 'general' ? 'Clasificación general (recalculada con sanciones)' : `Resultados de la carrera ${getCircuitoInfo(carreraSeleccionada) ?? ''}`}
        </div>

        {resultados.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={styles.mensajeNoResultados}>
              No hay resultados disponibles.
              <Image
                src="/imagenes/otras/sad.webp"
                alt="No hay resultados"
                width={1000}
                height={1000}
                className={styles.fotoNoResultados}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <table className="text-white min-w-[900px]">
              <thead>
                <tr className="bg-gray-800">
                  <th className="py-3 px-4 text-left">Pos</th>
                  <th className="py-3 px-4 text-left">Piloto</th>
                  <th className="py-3 px-4 text-center">Puntos</th>
                  <th className="py-3 px-4 text-center">Sanción</th>
                  {modo === 'carrera' && <th className="py-3 px-4 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {resultados.map((driver) => (
                  <tr
                    key={driver.posicion}
                    className={styles.fila}
                    style={{ backgroundColor: '#15151d' }}
                  >
                    <td className={styles.posicion}>
                      {driver.posicion}
                      {modo === 'carrera' && driver.posicionOriginal !== driver.posicion && (
                        <span style={{ fontSize: '0.7em', color: '#aaa', display: 'block' }}>
                          ({driver.posicionOriginal})
                        </span>
                      )}
                    </td>

                    <td className={getClassEquipo(driver.equipo)}>
                      <div className={styles.logoContainer}>
                        <div className={getClassEquipoLogo(driver.equipo)}></div>
                      </div>
                      <div className={styles.caraContainer}>
                        <div className={getClassPilotoFoto(driver.piloto, driver.equipo)}></div>
                      </div>
                      <div className={styles.pilotoNombre}>
                        {driver.piloto}
                        {driver.sancionTexto && (
                          <span style={{ fontSize: '0.75em', color: '#ff6b6b', marginLeft: '8px' }}>
                            [{driver.sancionTexto}]
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={styles.puntuacion} style={{ backgroundColor: 'red' }}>
                      {driver.puntos}
                    </td>

                    {/* Nueva columna Sanción */}
                    <td className="py-3 px-4 text-center text-sm">
                      {driver.sancion_segundos || driver.sancion_posiciones ? (
                        <>
                          {driver.sancion_segundos ? `+${driver.sancion_segundos}s ` : ''}
                          {driver.sancion_posiciones ? `${driver.sancion_posiciones} pos` : ''}
                        </>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>

                    {/* Botón y formulario de sanción (solo en modo carrera) */}
                    {modo === 'carrera' && (
                      <td className="py-3 px-4 text-center">
                        {editingDriverId === driver.id ? (
                          <div className="flex flex-col gap-2 bg-gray-800 p-3 rounded">
                            <select
                              value={sancionTipo}
                              onChange={e => setSancionTipo(e.target.value as 'segundos' | 'posiciones')}
                              className="bg-gray-700 text-white px-2 py-1 rounded"
                            >
                              <option value="segundos">Segundos</option>
                              <option value="posiciones">Posiciones</option>
                            </select>

                            <input
                              type="number"
                              value={sancionValor}
                              onChange={e => setSancionValor(Number(e.target.value))}
                              placeholder="Valor"
                              className="bg-gray-700 text-white px-2 py-1 rounded w-24"
                              min="0"
                            />

                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleGuardarSancion(driver)}
                                disabled={loadingSave}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                              >
                                {loadingSave ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDriverId(null);
                                  setSancionValor(0);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingDriverId(driver.id ?? null);
                              setSancionValor(driver.sancion_segundos || driver.sancion_posiciones || 0);
                              setSancionTipo(driver.sancion_posiciones ? 'posiciones' : 'segundos');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                          >
                            Sancionar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}