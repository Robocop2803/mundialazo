import { createClient } from '@/lib/supabase/server';
import styles from './clasificacion.module.css';
import type { NextApiRequest, NextApiResponse } from 'next'

// app/f1-standings/page.tsx
import { DriverStanding } from "@/types/f1";

export default async function F1Standings({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: any;
}) {

  const { temporada } = await searchParams;
  const { circuito } = await searchParams;

  const supabase = await createClient();
  const { data: carrera } = await supabase.from("resultados").select().eq('temporada', temporada).eq('carrera', circuito).order('posicion');

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          Clasificacion del mundialazo a tres temporada 2
        </h1>
        <div className="text-center text-gray-400 mb-8">
          puntos hasta el GP de España
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <table className="text-white">
            <tbody>
              {carrera?.map((driver) => (
                <tr key={driver.posicion} className={styles.fila} style={{ backgroundColor: "#15151d" }}>
                  <td className="py-2 px-4 text-center">{driver.posicion}</td>
                  <td className={getClassEquipo(driver.equipo)}>
                    <div className={getClassEquipoLogo(driver.equipo)}></div>
                  </td>
                  <td className={getClassEquipo(driver.equipo)}>
                    <div className={getClassPilotoFoto(driver.piloto, driver.equipo)}></div>
                  </td>
                  <td className={getClassPilotoNombre(driver.equipo)} >{driver.piloto}</td>
                  <td className={styles.puntuacion} style={{ backgroundColor: "red" }}>{driver.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/*
 <td className={getClassEquipo(driver.equipo)}>
                    <div className={getClassEquipoLogo(driver.equipo)}></div>
                  </td>
                  <td className={getClassEquipo(driver.equipo)}>
                    <div className={getClassPilotoFoto(driver.piloto, driver.equipo)}></div>
                  </td>
                  <td className={getClassPilotoNombre(driver.equipo)} >{driver.piloto}</td>
*/

function getClassEquipo(equipo: string) {
  return equipo === "McLaren" ? styles.mcLarenPiloto
    : equipo === "Red Bull" ? styles.redBullPiloto
      : equipo === "Mercedes-AMG Petronas" ? styles.mercedesPiloto
        : equipo === "Scuderia Ferrari HP" ? styles.ferrariPiloto
          : equipo === "Williams" ? styles.williamsPiloto
            : equipo === "Alpine" ? styles.alpinePiloto
              : equipo === "Aston Martin" ? styles.astonMartinPiloto
                : equipo === "Visa Cash App RB" ? styles.visaCashAppRBPiloto
                  : equipo === "Haas" ? styles.haasPiloto
                    : equipo === "KICK Sauber" ? styles.kickSauberPiloto :
                      styles.nullPiloto
}
function getClassPilotoNombre(equipo: string) {
  return `${styles.pilotoNombre} ${getClassEquipo(equipo)}`
}


function getClassEquipoLogo(equipo: string): string {
  let equipoStyle = equipo === "McLaren" ? styles.mcLarenLogo
    : equipo === "Red Bull" ? styles.redBullLogo
      : equipo === "Mercedes-AMG Petronas" ? styles.mercedesLogo
        : equipo === "Scuderia Ferrari HP" ? styles.ferrariLogo
          : equipo === "Williams" ? styles.williamsLogo
            : equipo === "Alpine" ? styles.alpineLogo
              : equipo === "Aston Martin" ? styles.astonMartinLogo
                : equipo === "Visa Cash App RB" ? styles.visaCashAppRBLogo
                  : equipo === "Haas" ? styles.haasLogo
                    : equipo === "KICK Sauber" ? styles.kickSauberLogo
                      : styles.nullLogo

  return `${styles.logo} ${getClassEquipo(equipo)} ${equipoStyle}`;
}

function getClassPilotoFoto(piloto: string, equipo: string) {
  let pilotoStyle = piloto === "VERSTAPPEN" ? styles.pilotoVerstappen
    : piloto === "CASTAN" ? styles.pilotoCastan
      : piloto === "ESPADA" ? styles.pilotoEspada
        : piloto === "DAVO" ? styles.pilotoDavo
          : piloto === "LECLERC" ? styles.pilotoLeclerc
            : piloto === "HAMILTON" ? styles.pilotoHamilton
              : piloto === "ALONSO" ? styles.pilotoAlonso
                : piloto === "SARGEANT" ? styles.pilotoSargent
                  : piloto === "PIASTRI" ? styles.pilotoPiastri
                    : piloto === "BOTTAS" ? styles.pilotoBottas
                      : piloto === "SAINZ" ? styles.pilotoSainz
                        : piloto === "GASLY" ? styles.pilotoGasly
                          : piloto === "TSUNODA" ? styles.pilotoTsunoda
                            : piloto === "ZHOU" ? styles.pilotoZhou
                              : piloto === "MAGNUSSEN" ? styles.pilotoMagnussen
                                : piloto === "RICCIARDO" ? styles.pilotoRicciardo
                                  : piloto === "PÉREZ" ? styles.pilotoPerez
                                    : piloto === "ALBON" ? styles.pilotoAlbon
                                      : piloto === "OCON" ? styles.pilotoOcon
                                        : piloto === "STROLL" ? styles.pilotoStroll
                                          : piloto === "NORRIS" ? styles.pilotoNorris
                                            : piloto === "RUSSELL" ? styles.pilotoRussell
                                              : piloto === "HULKENBERG" ? styles.pilotoHulkenberg
                                                : styles.pilotoNull

  return `${styles.pilotoCara} ${getClassEquipo(equipo)} ${pilotoStyle}`;
}