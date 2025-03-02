import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Users } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// Importar configuración según el entorno
const config = process.env.NODE_ENV === 'production' 
  ? (await import('./config.js')).default
  : (await import('./config.dev.js')).default;

// Configuración de la estrategia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
  passReqToCallback: true
};

passport.use(new JwtStrategy(jwtOptions, async (req, jwt_payload, done) => {
  try {
    const user = await Users.findById(jwt_payload.user.id);
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }
    if (!user.activo) {
      return done(null, false, { message: 'Usuario inactivo' });
    }
    return done(null, user);
  } catch (error) {
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
  passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
    scope: ['profile', 'email'],
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google callback recibido:', { 
        profileId: profile.id,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName
      });

      if (!profile.emails?.[0]?.value) {
        return done(new Error('No se recibió email del perfil de Google'), null);
      }

      let user = await Users.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      if (!user) {
        user = await Users.create({
          nombre: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: 'USER',
          activo: true
        });
        console.log('Nuevo usuario creado:', user);
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
        console.log('Usuario existente actualizado con googleId:', user);
      }

      if (!user.activo) {
        console.log('Usuario inactivo intentando acceder:', user);
        return done(null, false, { message: 'Usuario inactivo' });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error en autenticación de Google:', error);
      return done(error);
    }
  }));
} else {
  console.warn('Google OAuth no está configurado completamente. Verifica las variables de entorno:',
    {
      clientId: !!config.google.clientId,
      clientSecret: !!config.google.clientSecret,
      callbackUrl: config.google.callbackUrl
    }
  );
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