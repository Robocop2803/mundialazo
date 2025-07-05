import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resultado } from '../../types/Resultado';


// Handler principal de la API
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('consulta');

  try {
    switch (action) {
      case 'datosCarrera': {
        console.log("consultando datosCarrera");
        
        const version = searchParams.get('version');
        const { data, error } = await supabase
          .from('lista_carreras')
          .select('temporada, carrera, circuito')

          .eq("version", version)
          
          .order('temporada', { ascending: false })
          .order('carrera', { ascending: false })
          .limit(2);
          


        if (error) throw error;
        return Response.json({ data })
        return NextResponse.json({ success: true, data });
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
    const resultado: Resultado[] = body;


    const { data: dataUltimaCarrera, error:errorUltimaCarrera } = await supabase
          .from('lista_carreras')
          .select('carrera')
          .eq("version", resultado[0].version)
          .eq("temporada", resultado[0].temporada)
          .order('temporada', { ascending: false })
          .order('carrera', { ascending: false })
          .limit(1)
          .single();

          if (errorUltimaCarrera) throw errorUltimaCarrera;


      resultado.map((fila) => fila.carrera = dataUltimaCarrera?.carrera + 1 || 1)
      console.log(resultado);
          

    // Insertar el resultado en la tabla resultados
    const { data, error } = await supabase
      .from('resultados')
      .insert(resultado)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error al añadir resultado:', error);
    return NextResponse.json({ success: false, message: 'Error al añadir resultado' }, { status: 500 });
  }
}