import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resultado } from '../../types/Resultado';

interface Circuito {
  id: number;
  nombre: string;
  pais: string;
  // Añade más campos según tu esquema de circuitos
}

// Handler principal de la API
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'versiones': {
        // Usar una consulta raw para obtener temporadas únicas
        const { data, error } = await supabase.rpc('get_unique_temporadas');

        if (error) throw error;
        const versiones = data as number[]; // Asegúrate de que el tipo coincida con lo que devuelve tu función
        return NextResponse.json({ success: true, data: versiones });
      }

      case 'circuitos': {
        // Obtener todos los circuitos
        const { data, error } = await supabase
          .from('circuitos')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      default:
        return NextResponse.json({ success: false, message: 'Acción no válida. Usa ?action=versiones o ?action=circuitos' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en la API:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Obtener el cuerpo de la solicitud
    const body = await request.json();
    const resultado: Resultado = body;

    // Validar que los campos necesarios estén presentes
    if (!resultado.temporada || !resultado.carrera || !resultado.piloto || !resultado.equipo || !resultado.circuito) {
      return NextResponse.json({ success: false, message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Insertar el resultado en la tabla resultados
    const { data, error } = await supabase
      .from('resultados')
      .insert({
        temporada: resultado.temporada,
        carrera: resultado.carrera,
        posicion: resultado.posicion,
        piloto: resultado.piloto,
        equipo: resultado.equipo,
        parrilla: resultado.parrilla,
        paradas: resultado.paradas,
        vuelta_rapida: resultado.vuelta_rapida,
        tiempo: resultado.tiempo,
        puntos: resultado.puntos,
        circuito: resultado.circuito,
      })
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error al añadir resultado:', error);
    return NextResponse.json({ success: false, message: 'Error al añadir resultado' }, { status: 500 });
  }
}