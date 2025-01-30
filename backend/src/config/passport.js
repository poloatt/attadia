import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);
      
      // Verificar si el usuario existe
      let user = await prisma.user.findUnique({
        where: { 
          email: profile.emails[0].value 
        }
      });

      if (!user) {
        // Si no existe, créalo
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
            googleId: profile.id,
            password: '' // Password vacío para usuarios de Google
          }
        });
      } else {
        // Si existe, actualiza el googleId
        user = await prisma.user.update({
          where: { email: profile.emails[0].value },
          data: {
            googleId: profile.id,
            name: profile.displayName
          }
        });
      }
      
      done(null, user);
    } catch (error) {
      console.error('Error en autenticación Google:', error);
      done(error, null);
    }
  }
));

export default passport; 