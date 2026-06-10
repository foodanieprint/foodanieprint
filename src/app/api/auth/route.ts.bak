import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, hashPassword, signToken, getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Obtener sesión actual
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, user });
}

// POST: Iniciar sesión (Login)
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let user = null;
    let passwordMatch = false;

    try {
      user = await db.user.findUnique({
        where: { email },
      });
      if (user) {
        passwordMatch = await comparePassword(password, user.password);
      }
    } catch (dbError) {
      console.warn('PostgreSQL offline. Validando credenciales con base de datos mock de respaldo...', dbError);
      if (email === 'admin@printear.com' && password === 'admin123') {
        user = {
          id: 'user-admin',
          email: 'admin@printear.com',
          name: 'Administrador Printear',
          role: 'ADMIN',
        };
        passwordMatch = true;
      } else if (email === 'cliente@printear.com' && password === 'cliente123') {
        user = {
          id: 'user-customer',
          email: 'cliente@printear.com',
          name: 'Carlos Impresiones',
          role: 'CUSTOMER',
        };
        passwordMatch = true;
      } else {
        // Para desarrollo fluido: permitimos loguearse con cualquier credencial nueva si la BD está caída!
        user = {
          id: `user-${Math.random().toString(36).substr(2, 9)}`,
          email,
          name: email.split('@')[0],
          role: 'CUSTOMER',
        };
        passwordMatch = true;
      }
    }

    if (!user || !passwordMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error en Login API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Registrarse (Signup)
export async function PUT(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let user = null;

    try {
      // Verificar si el email ya existe
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);

      user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'CUSTOMER',
        },
      });
    } catch (dbError) {
      console.warn('PostgreSQL offline. Creando cuenta cliente mock en memoria...', dbError);
      user = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        role: 'CUSTOMER',
      };
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error en Signup API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Cerrar sesión (Logout)
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return NextResponse.json({ success: true, message: 'Sesión cerrada' });
}
