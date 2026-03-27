'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './clasificacion.module.css';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

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

const POINTS_BY_POSITION = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function getTeamName(teamId: number): string {
  return TEAM_NAMES[teamId] ?? 'chaquetero';
}

interface ResultRow {
  id?: number;
  posicion: number;
  posicionOriginal?: number;
  piloto: string;
  equipo: string;
  puntos: number;
  sancionTexto?: string;
  sancion_segundos?: number | null;
}

interface F1StandingsProps {
  data: RaceResult[];
  version?: string;
  circuitos?: Circuito[];   // ← Ahora se pasa como prop
}

export default function F1Standings({ 
  data = [], 
  version, 
  circuitos = [] 
}: F1StandingsProps) {

  const [modo, setModo] = useState<'general' | 'carrera'>('general');
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<number | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [sancionValor, setSancionValor] = useState<number>(0);
  const [loadingSave, setLoadingSave] = useState(false);

  const carrerasDisponibles = Array.from(new Set(data.map(r => r.id_carrera)))
    .sort((a, b) => b - a);

  // useEffect corregido (sin warning)
  useEffect(() => {
    if (carrerasDisponibles.length > 0 && carreraSeleccionada === null) {
      setCarreraSeleccionada(carrerasDisponibles[0]);
    }
  }, [carrerasDisponibles, carreraSeleccionada]);

  const getCircuitoInfo = (id: number | null): string => {
    if (id === null) return 'Carrera desconocida';
    const c = circuitos.find((circ) => circ.id === id);
    return c ? `${c.name} (${c.country})` : `Carrera ${id}`;
  };

  const handleGuardarSancion = async (driver: ResultRow) => {
    if (!driver.id) {
      alert('No se encontró el ID del registro');
      return;
    }

    setLoadingSave(true);

    const { error } = await supabase
      .from('resultadosV2')
      .update({ 
        sancion_segundos: sancionValor > 0 ? sancionValor : null 
      })
      .eq('id', driver.id);

    setLoadingSave(false);

    if (error) {
      console.error('Error al guardar sanción:', error);
      alert('Error al guardar: ' + error.message);
    } else {
      alert('Sanción guardada correctamente');
      setEditingDriverId(null);
      setSancionValor(0);
      window.location.reload();
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
        const puntosNuevos = pos <= POINTS_BY_POSITION.length 
          ? POINTS_BY_POSITION[pos - 1] 
          : 0;

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
      const puntosNuevos = posFinal <= POINTS_BY_POSITION.length 
        ? POINTS_BY_POSITION[posFinal - 1] 
        : 0;

      return {
        id: r.id,
        posicion: posFinal,
        posicionOriginal: r.position,
        piloto: r.name,
        equipo: getTeamName(r.teamId),
        puntos: puntosNuevos,
        sancionTexto: r.sancion_segundos && r.sancion_segundos > 0 
          ? `+${r.sancion_segundos}s` 
          : undefined,
        sancion_segundos: r.sancion_segundos,
      };
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8 tracking-tight">
          Clasificación {version || ''}<br />1ª Edición
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-10 border-b border-gray-800">
          <button
            onClick={() => setModo('general')}
            className={`pb-4 px-6 font-semibold text-lg transition-all ${
              modo === 'general'
                ? 'text-red-500 border-b-4 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setModo('carrera')}
            className={`pb-4 px-6 font-semibold text-lg transition-all ${
              modo === 'carrera'
                ? 'text-red-500 border-b-4 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Por Carrera
          </button>
        </div>

        {modo === 'carrera' && (
          <div className="flex justify-center mb-8">
            <select
              value={carreraSeleccionada ?? ''}
              onChange={(e) => setCarreraSeleccionada(Number(e.target.value))}
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 text-lg"
            >
              {carrerasDisponibles.map(c => (
                <option key={c} value={c}>
                  {getCircuitoInfo(c)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-center text-gray-400 mb-10 text-lg">
          {modo === 'general'
            ? 'Clasificación general (actualizada con sanciones)'
            : `Resultados - ${getCircuitoInfo(carreraSeleccionada)}`}
        </div>

        {resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={styles.mensajeNoResultados}>
              No hay resultados disponibles.
              <Image 
                src="/imagenes/otras/sad.webp" 
                alt="No hay resultados" 
                width={120} 
                height={120} 
                className="mt-6 opacity-80" 
              />
            </div>
          </div>
        ) : (
          <div className="md:hidden space-y-6">
            {resultados.map((driver) => (
              <div
                key={driver.posicion}
                className={`${styles.tarjetaEquipo} ${getClassEquipo(driver.equipo)}`}
              >
                <div className={styles.cabeceraEquipo}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className={styles.posicionCirculo}>
                        {driver.posicion}
                        {modo === 'carrera' && driver.posicionOriginal !== driver.posicion && (
                          <span className="text-xs opacity-70"> ({driver.posicionOriginal})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={styles.puntosGrande}>{driver.puntos}</div>
                      <div className="text-xs uppercase tracking-widest text-white/70">puntos</div>
                    </div>
                  </div>
                </div>

                <div className={styles.contenidoTarjeta}>
                  <div className="flex items-center gap-4">
                    <div className={styles.logoContainer}>
                      <div className={getClassEquipoLogo(driver.equipo)}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-bold text-white tracking-tight">{driver.piloto}</div>
                      <div className="text-white/80 text-lg">{driver.equipo}</div>
                      {driver.sancionTexto && (
                        <div className="text-red-400 font-medium mt-1">[{driver.sancionTexto}]</div>
                      )}
                    </div>
                  </div>

                  {modo === 'carrera' && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      {editingDriverId === driver.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-white/70 mb-2">Segundos de sanción</label>
                            <input
                              type="number"
                              value={sancionValor}
                              onChange={(e) => setSancionValor(Number(e.target.value))}
                              className="w-full bg-gray-900 border border-gray-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500"
                              placeholder="Ej: 5"
                              min="0"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleGuardarSancion(driver)}
                              disabled={loadingSave}
                              className="flex-1 bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-semibold transition disabled:opacity-70"
                            >
                              {loadingSave ? 'Guardando...' : 'Guardar Sanción'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingDriverId(null);
                                setSancionValor(0);
                              }}
                              className="flex-1 bg-gray-700 hover:bg-gray-600 py-4 rounded-2xl font-semibold transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDriverId(driver.id ?? null);
                            setSancionValor(driver.sancion_segundos ?? 0);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-semibold transition active:scale-95"
                        >
                          Aplicar / Editar Sanción
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder para tabla desktop */}
        <div className="hidden md:block mt-10">
          <p className="text-center text-gray-500 py-20">
            Tabla para desktop en desarrollo...<br />
            (Puedes añadirla más adelante)
          </p>
        </div>
      </div>
    </div>
  );
}

// ====================== HELPER FUNCTIONS ======================

function getClassEquipo(equipo: string): string {
  const classes: Record<string, string> = {
    'McLaren': styles.mcLaren,
    'Red Bull': styles.redBull,
    'Mercedes-AMG Petronas': styles.mercedes,
    'Scuderia Ferrari HP': styles.ferrari,
    'Williams': styles.williams,
    'Alpine': styles.alpine,
    'Aston Martin': styles.astonMartin,
    'Visa Cash App RB': styles.visaCashAppRB,
    'Haas': styles.haas,
    'KICK Sauber': styles.kickSauber,
    'chaquetero': styles.chaquetero,
  };
  return classes[equipo] ?? styles.nullEquipo;
}

function getClassEquipoLogo(equipo: string): string {
  const classes: Record<string, string> = {
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
    'chaquetero': styles.chaqueteroLogo,
  };
  return `${styles.logo} ${classes[equipo] ?? styles.nullLogo}`;
}