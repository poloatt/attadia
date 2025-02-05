import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Users } from '../models/index.js';
import config from './config.js';
import bcrypt from 'bcrypt';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret
};

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
  try {
    const user = await Users.findById(jwt_payload.user.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

let GoogleStrategy;
try {
  const { Strategy } = await import('passport-google-oauth20');
  GoogleStrategy = Strategy;
} catch (error) {
  console.log('Google OAuth no configurado');
}

if (GoogleStrategy) {
  passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
    proxy: true,
    passReqToCallback: true,
    scope: ['profile', 'email']
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Iniciando autenticación de Google');
      console.log('URL de callback:', config.google.callbackUrl);
      console.log('Configuración:', {
        clientId: config.google.clientId,
        callbackUrl: config.google.callbackUrl
      });
      console.log('Perfil de Google recibido:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        provider: profile.provider
      });
      
      if (!profile.emails?.[0]?.value) {
        console.error('No se recibió email del perfil de Google');
        return done(new Error('No email provided by Google'), null);
      }

      let user = await Users.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      console.log('Usuario encontrado:', user ? 'Sí' : 'No');
      
      if (!user) {
        console.log('Creando nuevo usuario');
        user = await Users.create({
          nombre: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: 'USER'
        });
        console.log('Usuario creado:', user._id);
      } else if (!user.googleId) {
        console.log('Actualizando googleId para usuario existente');
        user.googleId = profile.id;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error en autenticación de Google:', error);
      return done(error, null);
    }
  }));
}

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export const passportConfig = passport; 