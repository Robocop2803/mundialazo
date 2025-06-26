import { createClient } from '@/lib/supabase/server';
import styles from './clasificacion.module.css';
import Image from 'next/image';
import { Resultado } from '../../../types/Resultado';

// app/f1-standings/page.tsx

interface Circuito {
  id: number;
  nombre: string;
}


/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function F1Standings({ params, searchParams }: { params: { slug: string }; searchParams?: any }) {
  const supabase = await createClient();
  const temporadaParam = (await searchParams).temporada; // Obtener temporada desde searchParams
  const version = (await params).slug.replace('%20', ' ');
  console.log(version);



  // Función para obtener los datos y procesarlos
  async function obtenerYProcesarDatos() {
    let temporada: number;

    // Si no se pasa temporada en la URL, obtener la temporada máxima
    if (!temporadaParam) {
      const { data: maxTemporadaData, error: maxTemporadaError } = await supabase
        .from('resultados')
        .select('temporada')
        .eq('version', version)
        .order('temporada', { ascending: false })
        .limit(1);

      if (maxTemporadaError || !maxTemporadaData || maxTemporadaData.length === 0) {
        return { resultados: [], ultimoCircuito: '', temporada: 0 };
      }
      temporada = maxTemporadaData[0].temporada;
    } else {
      temporada = parseInt(temporadaParam, 10); // Convertir a número
    }

    // Consultar los datos desde Supabase para la temporada seleccionada
    const { data }: { data: Resultado[] | null} = await supabase
      .from('resultados')
      .select()
      .eq('version', version)
      .eq('temporada', temporada);

    // Verificar que los datos existan
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { resultados: [], ultimoCircuito: '', temporada };
    }

    // Calcular el último circuito
    //const ultimoCircuito = data.reduce((max, result) => result.carrera > max.carrera ? result : max).circuito);



     const circuitos: Circuito[]| null =  (await supabase
    .from('circuitos')
    .select('id, nombre')
    .order('id', { ascending: true })).data;

    //const ultimoCircuito = circuitos?.find((circuito) => circuito.id === (data.reduce((max, result) => result.carrera > max.carrera ? result : max).circuito))?.nombre;
      
    const carrerasCorridas = [...new Set(data.map((result) => result.carrera))].reverse();
    
    const ultimoCircuitoId = carrerasCorridas[0];
    //const penultimoCircuitoId = carrerasCorridas.length >= 2 ? carrerasCorridas[1] : 0;

    console.log(carrerasCorridas);

    const ultimoCircuito = circuitos?.find((circuito) => circuito.id === ultimoCircuitoId)?.nombre;
    
    
    // Sumar puntos por piloto y mantener el equipo
    const puntosPorPiloto = data.reduce(
      (
        acc: { [piloto: string]: { puntos: number; equipo: string } },
        carrera: Resultado
      ) => {
        const { piloto, puntos, equipo } = carrera;
        if (!acc[piloto]) {
          acc[piloto] = { puntos: 0, equipo };
        }
        acc[piloto].puntos += puntos;
        acc[piloto].equipo = acc[piloto].equipo == equipo? acc[piloto].equipo: "chaquetero";
        return acc;
      },
      {}
    );

    // Convertir a array de objetos, ordenar por puntos y añadir posición
    const resultados = Object.entries(puntosPorPiloto)
      .map(([piloto, { puntos, equipo }]) => ({ piloto, equipo, puntos }))
      .sort((a, b) => b.puntos - a.puntos)
      .map((item, index) => ({ ...item, posicion: index + 1 }));

      console.log(resultados);
      

    return { resultados, ultimoCircuito, temporada };
  }

  // Ejecutar la función y obtener resultados
  const { resultados, ultimoCircuito, temporada } = await obtenerYProcesarDatos();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          Clasificación del mundialazo {version || ''} {temporada ? 'temporada ' + temporada : 'no disponible'}
        </h1>





        {resultados.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={styles.mensajeNoResultados}>
              No hay resultados disponibles para esta temporada.
              <Image
                src="/imagenes/otras/sad.webp"
                alt="No hay resultados"
                width={1000} // Ajusta el ancho según necesites
                height={1000} // Ajusta la altura según necesites
                className={styles.fotoNoResultados}
              />
            </div>
          </div>

        ) : (
          <div className="text-center text-gray-400 mb-8">
            Puntos hasta el GP de <strong>{ultimoCircuito || 'No disponible'}</strong>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {
            <table className="text-white">
              <tbody>
                {resultados.map((driver) => (
                  <tr key={driver.posicion} className={styles.fila} style={{ backgroundColor: '#15151d' }}>
                    <td className={styles.posicion}>{driver.posicion}</td>
                    <td className={getClassEquipo(driver.equipo)}>
                      <div className={styles.logoContainer}>
                        <div className={getClassEquipoLogo(driver.equipo)}></div>
                      </div>
                      <div className={styles.caraContainer}>
                        <div className={getClassPilotoFoto(driver.piloto, driver.equipo)}></div>
                      </div>
                      <div className={styles.pilotoNombre}>{driver.piloto}</div>
                    </td>
                    <td className={styles.puntuacion} style={{ backgroundColor: 'red' }}>
                      {driver.puntos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
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
                      : styles[piloto.toLowerCase() + 'Chaquetero']}