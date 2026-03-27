'use client';

import { useState, useEffect } from 'react';
import styles from './clasificacion.module.css';
import Image from 'next/image';

interface RaceResult {
  position: number;
  name: string;
  teamId: number;
  points: number;
  id_carrera: number;
}

// 👉 Mapper de equipos
function getTeamName(teamId: number): string {
  switch (teamId) {
    case 0: return 'Mercedes-AMG Petronas';
    case 1: return 'Scuderia Ferrari HP';
    case 2: return 'Red Bull';
    case 3: return 'Williams';
    case 4: return 'Aston Martin';
    case 5: return 'Alpine';
    case 6: return 'Visa Cash App RB';
    case 7: return 'Haas';
    case 8: return 'McLaren';
    case 9: return 'KICK Sauber';
    default: return 'chaquetero';
  }
}

interface Circuito {
  id: number;
  name: string;
  country: string;
}

const circuitos: Circuito[] = [
  { id: 0, name: 'Albert Park', country: 'Australia' },
  { id: 2, name: 'Shanghai', country: 'China' },
  { id: 3, name: 'Sakhir', country: 'Bahréin' },
  { id: 4, name: 'Barcelona', country: 'España' },
  { id: 5, name: 'Monaco', country: 'Mónaco' },
  { id: 6, name: 'Montreal', country: 'Canadá' },
  { id: 7, name: 'Silverstone', country: 'Reino Unido' },
  { id: 9, name: 'Hungaroring', country: 'Hungría' },
  { id: 10, name: 'Spa', country: 'Bélgica' },
  { id: 11, name: 'Monza', country: 'Italia' },
  { id: 12, name: 'Singapore', country: 'Singapur' },
  { id: 13, name: 'Suzuka', country: 'Japón' },
  { id: 14, name: 'Yas Marina', country: 'EAU' },
  { id: 15, name: 'Austin', country: 'Estados Unidos' },
  { id: 16, name: 'Interlagos', country: 'Brasil' },
  { id: 17, name: 'Red Bull Ring', country: 'Austria' },
  { id: 19, name: 'México', country: 'México' },
  { id: 20, name: 'Baku', country: 'Azerbaiyán' },
  { id: 26, name: 'Zandvoort', country: 'Países Bajos' },
  { id: 27, name: 'Imola', country: 'Italia' },
  { id: 29, name: 'Jeddah', country: 'Arabia Saudita' },
  { id: 30, name: 'Miami', country: 'Estados Unidos' },
  { id: 31, name: 'Las Vegas', country: 'Estados Unidos' },
  { id: 32, name: 'Losail', country: 'Catar' },
  { id: 39, name: 'Silverstone (R)', country: 'Reino Unido' },
  { id: 40, name: 'Red Bull Ring (R)', country: 'Austria' },
  { id: 41, name: 'Zandvoort (R)', country: 'Países Bajos' }
];

export default function F1Standings({ params }: { params: any }) {
  const version = params.version;

  // 👉 datos
  const data: RaceResult[] = params || [];

  // 👉 tabs
  const [modo, setModo] = useState<'general' | 'carrera'>('general');

  // 👉 carrera seleccionada
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<number | null>(null);

  // 👉 lista de carreras
  const carrerasDisponibles = Array.from(
    new Set(data.map((r) => r.id_carrera))
  )


  // 👉 seleccionar última carrera por defecto
  useEffect(() => {
    if (carrerasDisponibles.length > 0 && carreraSeleccionada === null) {
      setCarreraSeleccionada(carrerasDisponibles[0]);
    }
  }, [carrerasDisponibles, carreraSeleccionada]);

  let resultados: any[] = [];

  // 🏆 GENERAL
  if (modo === 'general') {
    const puntosPorPiloto = data.reduce(
      (
        acc: { [piloto: string]: { puntos: number; equipo: string } },
        carrera: RaceResult
      ) => {
        const piloto = carrera.name;
        const puntos = carrera.points;
        const equipo = getTeamName(carrera.teamId);

        if (!acc[piloto]) {
          acc[piloto] = { puntos: 0, equipo };
        }

        acc[piloto].puntos += puntos;

        if (acc[piloto].equipo !== equipo) {
          acc[piloto].equipo = 'chaquetero';
        }

        return acc;
      },
      {}
    );

    resultados = Object.entries(puntosPorPiloto)
      .map(([piloto, { puntos, equipo }]) => ({
        piloto,
        equipo,
        puntos
      }))
      .sort((a, b) => b.puntos - a.puntos)
      .map((item, index) => ({
        ...item,
        posicion: index + 1
      }));

  } else {
    // 🏁 CARRERA (siempre filtrada)
    const dataFiltrada = data.filter(
      (r) => r.id_carrera === carreraSeleccionada
    );

    resultados = dataFiltrada.map((r) => ({
      piloto: r.name,
      equipo: getTeamName(r.teamId),
      puntos: r.points,
      posicion: r.position
    }));
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">

        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Clasificación {version || ''}
        </h1>

        {/* 🔥 TABS */}
        <div className="flex justify-center gap-6 mb-8 border-b border-gray-700">
          <button
            onClick={() => setModo('general')}
            className={`pb-2 font-semibold transition ${modo === 'general'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Clasificación general
          </button>

          <button
            onClick={() => setModo('carrera')}
            className={`pb-2 font-semibold transition ${modo === 'carrera'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Carreras
          </button>
        </div>

        {/* 🎯 SELECTOR DE CARRERA */}
        {modo === 'carrera' && (
          <div className="flex justify-center mb-6">
            <select
              value={carreraSeleccionada ?? ''}
              onChange={(e) => setCarreraSeleccionada(Number(e.target.value))}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600"
            >
              {carrerasDisponibles.map((carrera, index) => (
                <option key={carrera} value={carrera}>
                  {index + 1}º Carrera: {getCircuitoInfo(carrera ?? 0)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 📝 TEXTO */}
        <div className="text-center text-gray-400 mb-8">
          {modo === 'general'
            ? 'Clasificación general acumulada'
            : `Resultados de la carrera ${getCircuitoInfo(carreraSeleccionada ?? 0) ?? ''}`}
        </div>

        {/* 📊 TABLA */}
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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <table className="text-white">
              <tbody>
                {resultados.map((driver) => (
                  <tr
                    key={driver.posicion}
                    className={styles.fila}
                    style={{ backgroundColor: '#15151d' }}
                  >
                    <td className={styles.posicion}>{driver.posicion}</td>

                    <td className={getClassEquipo(driver.equipo)}>
                      <div className={styles.logoContainer}>
                        <div className={getClassEquipoLogo(driver.equipo)}></div>
                      </div>

                      <div className={styles.caraContainer}>
                        <div
                          className={getClassPilotoFoto(
                            driver.piloto,
                            driver.equipo
                          )}
                        ></div>
                      </div>

                      <div className={styles.pilotoNombre}>
                        {driver.piloto}
                      </div>
                    </td>

                    <td
                      className={styles.puntuacion}
                      style={{ backgroundColor: 'red' }}
                    >
                      {driver.puntos}
                    </td>
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

// Funciones auxiliares (sin cambios)
function getClassEquipo(equipo: string) {
  return equipo === 'McLaren' ? styles.mcLarenPiloto
    : equipo === 'Red Bull' ? styles.redBullPiloto
      : equipo === 'Mercedes-AMG Petronas' ? styles.mercedesPiloto
        : equipo === 'Scuderia Ferrari HP' ? styles.ferrariPiloto
          : equipo === 'Williams' ? styles.williamsPiloto
            : equipo === 'Alpine' ? styles.alpinePiloto
              : equipo === 'Aston Martin' ? styles.astonMartinPiloto
                : equipo === 'Visa Cash App RB' ? styles.visaCashAppRBPiloto
                  : equipo === 'Haas' ? styles.haasPiloto
                    : equipo === 'KICK Sauber' ? styles.kickSauberPiloto
                      : equipo === 'chaquetero' ? styles.chaquetero
                        : styles.nullPiloto;
}

function getClassEquipoLogo(equipo: string): string {
  const equipoStyle = equipo === 'McLaren' ? styles.mcLarenLogo
    : equipo === 'Red Bull' ? styles.redBullLogo
      : equipo === 'Mercedes-AMG Petronas' ? styles.mercedesLogo
        : equipo === 'Scuderia Ferrari HP' ? styles.ferrariLogo
          : equipo === 'Williams' ? styles.williamsLogo
            : equipo === 'Alpine' ? styles.alpineLogo
              : equipo === 'Aston Martin' ? styles.astonMartinLogo
                : equipo === 'Visa Cash App RB' ? styles.rbHondaLogo
                  : equipo === 'Haas' ? styles.haasLogo
                    : equipo === 'KICK Sauber' ? styles.kickSauberLogo

                      : styles.nullLogo;

  return `${styles.logo} ${equipoStyle}`;
}

function getClassPilotoFoto(piloto: string, equipo: string) {
  const pilotoStyle = piloto === 'VERSTAPPEN' ? styles.pilotoVerstappen
    : piloto === 'CASTAN' ? getClassFotoNuestra(piloto, equipo)
      : piloto === 'ESPADA' ? getClassFotoNuestra(piloto, equipo)
        : piloto === 'DAVO' ? getClassFotoNuestra(piloto, equipo)
          : piloto === 'LECLERC' ? styles.pilotoLeclerc
            : piloto === 'HAMILTON' ? styles.pilotoHamilton
              : piloto === 'ALONSO' ? styles.pilotoAlonso
                : piloto === 'SARGEANT' ? styles.pilotoSargeant
                  : piloto === 'PIASTRI' ? styles.pilotoPiastri
                    : piloto === 'BOTTAS' ? styles.pilotoBottas
                      : piloto === 'SAINZ' ? styles.pilotoSainz
                        : piloto === 'GASLY' ? styles.pilotoGasly
                          : piloto === 'TSUNODA' ? styles.pilotoTsunoda
                            : piloto === 'ZHOU' ? styles.pilotoZhou
                              : piloto === 'MAGNUSSEN' ? styles.pilotoMagnussen
                                : piloto === 'RICCIARDO' ? styles.pilotoRicciardo
                                  : piloto === 'PÉREZ' ? styles.pilotoPerez
                                    : piloto === 'ALBON' ? styles.pilotoAlbon
                                      : piloto === 'OCON' ? styles.pilotoOcon
                                        : piloto === 'STROLL' ? styles.pilotoStroll
                                          : piloto === 'NORRIS' ? styles.pilotoNorris
                                            : piloto === 'RUSSELL' ? styles.pilotoRussell
                                              : piloto === 'HULKENBERG' ? styles.pilotoHulkenberg
                                                : styles.pilotoNull;

  return `${styles.cara} ${pilotoStyle}`;
}

function getClassFotoNuestra(piloto: string, equipo: string) {
  return equipo === 'McLaren' ? styles[piloto.toLowerCase() + 'McLaren']
    : equipo === 'Red Bull' ? styles[piloto.toLowerCase() + 'RedBull']
      : equipo === 'Mercedes-AMG Petronas' ? styles[piloto.toLowerCase() + 'Mercedes']
        : equipo === 'Scuderia Ferrari HP' ? styles[piloto.toLowerCase() + 'Ferrari']
          : equipo === 'Williams' ? styles[piloto.toLowerCase() + 'Williams']
            : equipo === 'Alpine' ? styles[piloto.toLowerCase() + 'Alpine']
              : equipo === 'Aston Martin' ? styles[piloto.toLowerCase() + 'AstonMartin']
                : equipo === 'Visa Cash App RB' ? styles[piloto.toLowerCase() + 'RbHonda']
                  : equipo === 'Haas' ? styles[piloto.toLowerCase() + 'Haas']
                    : equipo === 'KICK Sauber' ? styles[piloto.toLowerCase() + 'KickSauber']
                      : styles[piloto.toLowerCase() + 'Chaquetero']
}

function getCircuitoInfo(id: number) {
  const circuito = circuitos.find((c) => c.id === id);

  if (!circuito) return 'Circuito desconocido';


  return `${circuito.name} (${circuito.country})`;
}

function getFlagUrl(country: string) {
  const flags: Record<string, string> = {
    'Australia': '🇦🇺',
    'China': '🇨🇳',
    'Bahréin': '🇧🇭',
    'España': '🇪🇸',
    'Mónaco': '🇲🇨',
    'Canadá': '🇨🇦',
    'Reino Unido': '🇬🇧',
    'Hungría': '🇭🇺',
    'Bélgica': '🇧🇪',
    'Italia': '🇮🇹',
    'Singapur': '🇸🇬',
    'Japón': '🇯🇵',
    'EAU': '🇦🇪',
    'Estados Unidos': '🇺🇸',
    'Brasil': '🇧🇷',
    'Austria': '🇦🇹',
    'México': '🇲🇽',
    'Azerbaiyán': '🇦🇿',
    'Países Bajos': '🇳🇱',
    'Arabia Saudita': '🇸🇦',
    'Catar': '🇶🇦'
  };

  return `https://flagcdn.com/24x18/${flags[country].toLowerCase()}.png` || '🏁';
}