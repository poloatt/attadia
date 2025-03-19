import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Users } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// Importar configuración según el entorno
let config;
try {
  // Cargar directamente desde config.js para asegurar consistencia
  config = (await import('./config.js')).default;
} catch (error) {
  console.error('Error al cargar la configuración en passport, usando configuración básica:', error.message);
  // Configuración básica por defecto
  config = {
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    frontendUrl: process.env.FRONTEND_URL || 'https://staging.present.attadia.com',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'https://api.staging.present.attadia.com/api/auth/google/callback'
    }
  };
}

// Configuración de la estrategia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
  passReqToCallback: true
};

passport.use(new JwtStrategy(jwtOptions, async (req, jwt_payload, done) => {
  try {
    console.log('Verificando token JWT:', {
      payload: jwt_payload,
      user: jwt_payload.user,
      exp: new Date(jwt_payload.exp * 1000).toISOString()
    });

    const user = await Users.findById(jwt_payload.user.id);
    if (!user) {
      console.log('Usuario no encontrado en la base de datos');
      return done(null, false, { message: 'Usuario no encontrado' });
    }
    if (!user.activo) {
      console.log('Usuario inactivo');
      return done(null, false, { message: 'Usuario inactivo' });
    }
    return done(null, user);
  } catch (error) {
    console.error('Error en verificación JWT:', error);
    return done(error);
  }
}));

// Configuración de la estrategia Local
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }
    
    if (!user.activo) {
      return done(null, false, { message: 'Usuario inactivo' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Contraseña incorrecta' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Configuración de la estrategia Google OAuth2
if (config.google.clientId && config.google.clientSecret) {
  console.log('Configurando estrategia de Google OAuth2 para ambiente:', {
    env: config.env,
    callbackURL: config.google.callbackUrl,
    proxy: true
  });

  passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
    passReqToCallback: true,
    scope: ['profile', 'email', 'openid'],
    proxy: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google callback recibido en ambiente:', { 
        env: config.env,
        profileId: profile.id,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        accessToken: accessToken ? 'presente' : 'ausente',
        refreshToken: refreshToken ? 'presente' : 'ausente',
        code: req.query?.code
      });

      if (!profile || !profile.emails || !profile.emails[0]?.value) {
        console.error('Perfil de Google incompleto en ambiente:', {
          env: config.env,
          profile: profile._json
        });
        return done(null, false, { message: 'Perfil de Google incompleto' });
      }

      try {
        let user = await Users.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });
        
        if (!user) {
          console.log('Creando nuevo usuario con Google en ambiente:', config.env);
          user = await Users.create({
            nombre: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: 'USER',
            activo: true,
            lastLogin: new Date()
          });
        } else {
          console.log('Actualizando usuario existente en ambiente:', config.env);
          user.lastLogin = new Date();
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          await user.save();
        }

        if (!user.activo) {
          return done(null, false, { message: 'Usuario inactivo' });
        }
        
        return done(null, user);
      } catch (dbError) {
        console.error('Error en la base de datos en ambiente:', {
          env: config.env,
          error: dbError
        });
        return done(dbError);
      }
    } catch (error) {
      console.error('Error en autenticación de Google en ambiente:', {
        env: config.env,
        error
      });
      return done(error);
    }
  }));
} else {
  console.warn('Google OAuth no está configurado completamente para ambiente:', config.env, {
    clientId: !!config.google.clientId,
    clientSecret: !!config.google.clientSecret,
    callbackUrl: config.google.callbackUrl
  });
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id);
    if (!user) {
      return done(null, false);
    }
    if (!user.activo) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export const passportConfig = passport; 